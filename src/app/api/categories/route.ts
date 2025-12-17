import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  createCategoriesSchema,
  updateCategoriesSchema,
} from "@/validators/categories.schema";
// lister les annonces
export async function GET() {
  try {
    const categories = await prisma.categories.findMany();
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
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
    where: { id: parseResult.data.userId },
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
      userId: parseResult.data.userId,
    },
  });
  // Enlever userId et id de la réponse
  const { id, ...categoryWithoutId } = newCategory;

  // Renvoyer la réponse
  return NextResponse.json(categoryWithoutId, { status: 201 });
}
// mettre à jour une catégorie
export async function PUT(req: Request) {
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
    where: { id: parseResult.data.id },
    data: {
      title: parseResult.data.title ?? existingCategory.title,
      description: parseResult.data.description ?? existingCategory.description,
    },
  });

  // enlever l'id de la catégorie et renvoyer la catégorie
  const { id, ...categoryWithoutId } = updatedCategory;
  return NextResponse.json(categoryWithoutId, { status: 200 });
}

// supprimer une catégorie
export async function DELETE(req: Request) {
  try {
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
