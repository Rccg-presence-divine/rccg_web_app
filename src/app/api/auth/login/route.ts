import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { loginSchema } from "@/validators/auth.schema";
import { signRefreshToken, signAccessToken } from "@/lib/jwt";
import * as argon2 from "argon2";
import { authRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // l'adresse IP du client
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";

  /** 
   * Récupération des informations de rate limit 
   * success: boolean - si la requête est autorisée
   * remaining: number - nombre de requêtes restantes
   * reset: number - timestamp de réinitialisation
   * */
  const { success, remaining, reset } = await authRateLimit.limit(ip);

  // Si la limite est dépassée, retourner une erreur 429
  if (!success) {
    return NextResponse.json(
      {
        error: "TOO_MANY_REQUESTS",
        message: "Trop de tentatives, réessayez plus tard.",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      }
    );
  }

  // Récupération des données de la requête
  const body = await req.json();

  // Validation avec Zod
  const parseResult = loginSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Identifiant ou mot de passe incorrect.",
        details: parseResult.error.issues,
      },
      { status: 400 }
    );
  }

  // Au moins email ou phone doit être fourni
  if (!parseResult.data.email && !parseResult.data.phone) {
    return NextResponse.json(
      { error: "Email ou téléphone requis pour la connexion." },
      { status: 400 }
    );
  }

  // Rechercher l'utilisateur par email ou téléphone
  let existingUser = null;
  if (parseResult.data.email) {
    existingUser = await prisma.users.findUnique({
      where: { email: parseResult.data.email },
    });
  } else if (parseResult.data.phone) {
    existingUser = await prisma.users.findFirst({
      where: { phone: parseResult.data.phone },
    });
  }

  if (!existingUser) {
    return NextResponse.json(
      { error: "L'utilisateur n'existe pas." },
      { status: 400 }
    );
  }

  // Vérifier le mot de passe
  const isPasswordValid = await argon2.verify(
    existingUser.password,
    parseResult.data.password
  );
  if (!isPasswordValid) {
    return NextResponse.json(
      { error: "Identifiant ou mot de passe incorrect." },
      { status: 400 }
    );
  }

  // Créer access token
  const accessToken = await signAccessToken({
    id: existingUser.id,
    role: existingUser.role,
  });
  // Créer refresh token
  const refreshToken = await signRefreshToken({
    id: existingUser.id,
    role: existingUser.role,
  });

  // ✅ CRÉER LA RÉPONSE UNE SEULE FOIS
  const response = NextResponse.json(
    {
      message: "Connexion réussie",
      accessToken: accessToken,
    },
    { status: 200 }
  );

  // Enregistrer le refresh token dans les cookies
  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  // Ajouter le refresh token dans la base de données
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: existingUser.id,
    },
  });

  // Retirer le mot de passe avant de renvoyer l'utilisateur
  return response;
}
