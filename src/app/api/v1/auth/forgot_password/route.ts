import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/validators/auth.schema";
import * as argon2 from "argon2";
// import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // // l'adresse IP du client
  // const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  // try {
  //   await rateLimit({
  //     ip,
  //     route: "FORGOT_PASSWORD",
  //     limit: 5,
  //     windowMs: 10 * 60 * 1000, // 10 min
  //   });
  // } catch {
  //   return Response.json(
  //     { error: "Trop de tentatives, réessayez plus tard." },
  //     { status: 429 }
  //   );
  // }

  // Récupération des données de la requête
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
  const newPassword = await argon2.hash(parseResult.data.newPassword);

  const user = await prisma.users.update({
    where: { email: parseResult.data.email },
    data: { password: newPassword },
  });
  return NextResponse.json({ message: "Email envoyé avec succès.", user });
}
