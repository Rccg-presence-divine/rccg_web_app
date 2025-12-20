import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { registerSchema } from "@/validators/auth.schema";
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

  const { id, password, ...userWithoutPassword } = createdUser;

  return NextResponse.json(userWithoutPassword, { status: 201 });
}
