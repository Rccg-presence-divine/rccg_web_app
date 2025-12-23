import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Supprimer
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    // validation de l'ID utilisateur
    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant de l'utilisateur est requis." },
        { status: 400 }
      );
    }
    // vérifier si l'utilisateur existe
    const existingUser = await prisma.users.findUnique({
      where: { id },
    });
    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé." },
        { status: 404 }
      );
    }
    // supprimer l'utilisateur
    await prisma.users.delete({
      where: { id },
    });
    return NextResponse.json(
      { message: "Utilisateur supprimé avec succès." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la suppression de l'utilisateur.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
