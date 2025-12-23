import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyRole } from "@/lib/auth";

// supprimer une vidéo
export async function DELETE(req: Request) {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR", "MODERATOR"]);
    const { id } = await req.json();
    const existingVideo = await prisma.medias.findUnique({
      where: { id: id },
    });
    if (!existingVideo) {
      return NextResponse.json(
        { error: "Media introuvable." },
        { status: 404 }
      );
    }
    await prisma.medias.delete({
      where: { id: id },
    });
    return NextResponse.json(
      { message: "Média supprimée avec succès." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Vous n'avez pas la permission de supprimer la vidéo.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
