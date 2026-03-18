import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyRole } from "@/lib/auth";

// supprimer une catégorie
export async function DELETE(req: Request) {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR", "MODERATOR"]);

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
