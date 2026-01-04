import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { registerSchema } from "@/validators/auth.schema";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";
import * as argon2 from "argon2";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent");
  const ipAddress = headersList.get("x-forwarded-for");

  // Récupération des données de la requête
  const body = await req.json();

  // Validation avec Zod
  const parseResult = registerSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Données utilisateur invalides.",
        details: parseResult.error.issues,
      },
      { status: 400 }
    );
  }

  // Vérification de l'unicité de l'email
  const existingUser = await prisma.users.findUnique({
    where: { email: parseResult.data.email },
  });
  // Si l'utilisateur existe deja, retourner une erreur
  if (existingUser) {
    return NextResponse.json(
      { error: "Un utilisateur avec cet email existe deja." },
      { status: 400 }
    );
  }

  // Hasher le mot de passe
  const hashedPassword = await argon2.hash(parseResult.data.password);
  // verify password
  const verifyPassword = await argon2.verify(
    hashedPassword,
    parseResult.data.verifyPassword
  );
  if (!verifyPassword) {
    return NextResponse.json(
      { error: "les mots de passe ne correspondent pas" },
      { status: 400 }
    );
  }

  const createdUser = await prisma.users.create({
    data: {
      email: parseResult.data.email,
      password: hashedPassword,
      name: parseResult.data.name,
      phone: parseResult.data.phone,
    },
  });

  // Créer access token
  const accessToken = await signAccessToken({
    id: createdUser.id,
    role: createdUser.role,
  })
  // Créer refresh token
  const refreshToken = await signRefreshToken({
    id: createdUser.id,
    role: createdUser.role,
  });
  // créer une session
  await prisma.session.create({
    data:{
      userId: createdUser.id,
      refreshToken,
      userAgent,
      ipAddress,
    }
  })
  // Envoyer la reponse avec les tokens: Access er Refresh
  const response = NextResponse.json(
    { message: "Compte créé avec succès",
      accessToken: accessToken, },
    { status: 201 }
  );
  // Enregistrer le refresh token dans les cookies
  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  const { id, password, ...userWithoutPassword } = createdUser;

  return response;
}
