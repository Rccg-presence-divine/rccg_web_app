import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAnyRole } from "@/lib/auth";
import {
  createCategoriesSchema,
  updateCategoriesSchema,
} from "@/validators/categories.schema";
// lister les annonces
export async function GET() {
  try {
    const { userId } = await requireAnyRole([
      "SUPERADMIN",
      "PASTOR",
      "MODERATOR",
    ]);
    const categories = await prisma.categories.findMany();
    return NextResponse.json(
      { message: "Liste des catégories chargés.", categories },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      if (error.message === "Accès interdit") {
        return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
      }
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des catégories.",
        detail:
          process.env.MODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// créer une catégorie
export async function POST(req: Request) {
  try {
    const { userId } = await requireAnyRole([
      "SUPERADMIN",
      "PASTOR",
      "MODERATOR",
    ]);
    const body = await req.json();

    // Validation avec Zod
    const parseResult = createCategoriesSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données de catégorie invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }
    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.users.findUnique({
      where: { id: Number(userId) },
    });
    if (!existingUser) {
      return NextResponse.json(
        { error: "L'utilisateur n'existe pas." },
        { status: 400 }
      );
    }

    // Créer la catégorie
    const newCategory = await prisma.categories.create({
      data: {
        title: parseResult.data.title,
        description: parseResult.data.description,
        userId: Number(userId),
      },
    });
    // Enlever userId et id de la réponse
    const { id, ...categoryWithoutId } = newCategory;

    // Renvoyer la réponse
    return NextResponse.json(
      { message: "Catégorie crée.", categoryWithoutId },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Auth error:", error.message);
    }
    return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
  }
}
// mettre à jour une catégorie
export async function PUT(req: Request) {
  try {
    const { userId } = await requireAnyRole([
      "SUPERADMIN",
      "PASTOR",
      "MODERATOR",
    ]);

    const body = await req.json();

    // Validation avec Zod
    const parseResult = updateCategoriesSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données de catégorie invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Vérifier si la catégorie existe
    const existingCategory = await prisma.categories.findUnique({
      where: { id: parseResult.data.id },
    });
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Cette catégorie n'existe pas." },
        { status: 404 }
      );
    }

    // inserer les données sans la base de données
    const updatedCategory = await prisma.categories.update({
      where: { id: Number(userId) },
      data: {
        title: parseResult.data.title ?? existingCategory.title,
        description:
          parseResult.data.description ?? existingCategory.description,
      },
    });

    // enlever l'id de la catégorie et renvoyer la catégorie
    const { id, ...categoryWithoutId } = updatedCategory;
    return NextResponse.json(
      { message: "Catégorie mise à jour.", categoryWithoutId },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Auth error:", error.message);
    }
    return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
  }
}

// supprimer une catégorie
export async function DELETE(req: Request) {
  try {
    const { userId } = await requireAnyRole([
      "SUPERADMIN",
      "PASTOR",
      "MODERATOR",
    ]);

    const { id } = await req.json();
    const existingCategory = await prisma.categories.findUnique({
      where: { id: id },
    });
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Cette catégorie n'existe pas." },
        { status: 404 }
      );
    }
    // Supprimer la catégorie
    await prisma.categories.delete({
      where: { id: id },
    });
    return NextResponse.json(
      { message: "Catégorie supprimée avec succès." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      if (error.message === "Accès interdit") {
        return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
      }
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la suppression de la catégorie.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
