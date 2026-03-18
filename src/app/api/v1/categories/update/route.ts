import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyRole } from "@/lib/auth";
import { updateCategoriesSchema } from "@/validators/categories.schema";

// mettre à jour une catégorie
export async function PUT(req: Request) {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR", "MODERATOR"]);

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
