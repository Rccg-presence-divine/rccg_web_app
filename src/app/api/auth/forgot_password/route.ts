import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/validators/auth.schema";
import * as argon2 from "argon2";

export async function POST(req: Request) {
  const body = await req.json();

  // Validation avec Zod
  const parseResult = forgotPasswordSchema.safeParse(body);
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
  if (!existingUser) {
    return NextResponse.json(
      { error: "Un utilisateur avec cet email n'existe pas." },
      { status: 400 }
    );
  }

  // Envoyer un email de reinitialisation de mot de passe
  // ...
  const newPassword = await argon2.hash(parseResult.data.newPassword)

  const user = await prisma.users.update({
    where: {email: parseResult.data.email},
    data: {password: newPassword}
  })
  return NextResponse.json({ message: "Email envoyé avec succès.", user });
}
