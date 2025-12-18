import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { loginSchema } from "@/validators/auth.schema";
import * as argon2 from "argon2";

export async function POST(req: Request) {
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

  // Retirer le mot de passe avant de renvoyer l'utilisateur
  const { password, ...userPublic } = existingUser;
  return NextResponse.json(userPublic, {
    status: 200,
    statusText: "Utilisateur connecté avec succès.",
  });
}
