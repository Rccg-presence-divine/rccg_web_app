import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createUserSchema } from "@/validators/users.schema";
import * as argon2 from "argon2";
import { requireAnyRole } from "@/lib/auth";

// créer un nouvel utilisateur
export async function POST(req: Request) {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR"]);

    // Récupération des données de la requête
    const body = await req.json();

    // Validation avec Zod
    const parseResult = createUserSchema.safeParse(body);
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
    // Si l'utilisateur existe déjà, retourner une erreur
    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà." },
        { status: 400 }
      );
    }

    // Extraction des données validées
    const { password, ...userData } = parseResult.data;

    // hachage du mot de passe et création de l'utilisateur
    const hashedPassword = await argon2.hash(password);

    // Création de l'utilisateur dans la base de données
    const newUser = await prisma.users.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "Utilisateur créé avec succès.", userData },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la creation de l'utilisateur.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}