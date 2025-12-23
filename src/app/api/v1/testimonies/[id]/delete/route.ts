import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
// Supprimer un témoignage
export async function DELETE(req: Request) {
  try {
    const { userId, role } = await requireAuth();
    const { id } = await req.json();
    const existing = await prisma.testimonies.findUnique({
      where: { id: id },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Témoignage introuvable." },
        { status: 404 }
      );
    // vérifier que l'utilisateur est le propriétaire du témoignage ou est SUPERADMIN
    if (existing.userId !== userId && role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer ce témoignage." },
        { status: 403 }
      );
    }
    await prisma.testimonies.delete({
      where: { id: id },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/v1/testimonies error", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression." },
      { status: 500 }
    );
  }
}
