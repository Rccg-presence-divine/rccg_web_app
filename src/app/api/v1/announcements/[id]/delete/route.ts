import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyRole } from "@/lib/auth";

// supprimer une annonce
export async function DELETE(req: Request) {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR", "MODERATOR"]);
    const { id } = await req.json();
    const existingAnnouncement = await prisma.announcements.findUnique({
      where: { id: id },
    });
    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: "Cette annonce n'existe pas." },
        { status: 404 }
      );
    }
    await prisma.announcements.delete({
      where: { id: id },
    });
    return NextResponse.json(
      { message: "Annonce supprimée avec succès." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Vous n'avez pas le droit necessaire pour supprier l'annonce.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
