import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateUserSchema } from "@/validators/users.schema";
import * as argon2 from "argon2";
import { requireAuth } from "@/lib/auth";
// Mettre à jour
export async function PUT(req: Request) {
  try {
    const { userId } = await requireAuth();

    // Récupération des données de la requête
    const body = await req.json();

    // Validation avec Zod
    const parseResult = updateUserSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données utilisateur invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Vérification de l'existence de l'utilisateur
    const existingUser = await prisma.users.findUnique({
      where: { id: parseResult.data.id },
    });
    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé." },
        { status: 404 }
      );
    }
    // Vérifier si l'utilisateur est l'auteur de son propre compte
    if (existingUser.id !== userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez modifier que votre propre compte." },
        { status: 403 }
      );
    }
    // Hasher le mot de passe si fourni
    if (parseResult.data.password) {
      parseResult.data.password = await argon2.hash(parseResult.data.password);
    }

    // Récupération des données ecepté le id de l'utilisateur
    const { id, name, email, phone, role, password } = parseResult.data;
    // Mise à jour de l'utilisateur dans la base de données
    const updatedUser = await prisma.users.update({
      where: { id: id },
      data: {
        name: name ?? existingUser.name,
        email: email ?? existingUser.email,
        phone: phone ?? existingUser.phone,
        role: role ?? existingUser.role,
        password: password ?? existingUser.password,
      },
    });

    // retirer l'id et le mot de passe avant de renvoyer la réponse
    const { id: _, password: __, ...userPublic } = updatedUser;

    return NextResponse.json(
      { message: "Utilisateur modifié avec succès.", userPublic },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la modification de l'utilisateur.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
