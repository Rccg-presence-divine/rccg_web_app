import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyRole } from "@/lib/auth";
import { createCategoriesSchema } from "@/validators/categories.schema";
// créer une catégorie
export async function POST(req: Request) {
  try {
    const { userId } = await requireAnyRole([
      "SUPERADMIN",
      "PASTOR",
      "MODERATOR",
    ]);
    console.log("Authenticated userId:", userId);
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
      where: { id: userId },
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
        userId: userId,
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
