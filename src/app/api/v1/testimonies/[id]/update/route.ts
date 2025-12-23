import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateTestimoniesSchema } from "@/validators/testimonies.schema";
import { requireAuth } from "@/lib/auth";
// modifier un témoignage
export async function PUT(req: Request) {
  try {
    const { userId } = await requireAuth();

    const body = await req.json();

    // validation
    const parseResult = updateTestimoniesSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données de témoignage invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }
    // vérifier que le témoignage existe
    const existing = await prisma.testimonies.findUnique({
      where: { id: parseResult.data.id },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Témoignage introuvable." },
        { status: 404 }
      );
    // vérifier que l'utilisateur est le propriétaire du témoignage ou a un rôle élevé
    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas auteur de ce témoignage pour le modifier." },
        { status: 403 }
      );
    }

    const updated = await prisma.testimonies.update({
      where: { id: parseResult.data.id },
      data: {
        title: parseResult.data.title ?? existing.title,
        content: parseResult.data.content ?? existing.content,
        datePosted: existing.datePosted,
      },
    });

    const { id, ...updatedWithoutId } = updated;
    return NextResponse.json(
      { message: "Témoignage modifié avec succès.", updatedWithoutId },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Utilisateur non authentifié." },
      { status: 401 }
    );
  }
}