import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateAnnouncementsSchema } from "@/validators/announcements.schema";
import { requireAnyRole } from "@/lib/auth";


// mettre à jour une annonce
export async function PUT(req: Request) {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR", "MODERATOR"]);

    const body = await req.json();

    // Validation avec Zod
    const parseResult = updateAnnouncementsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données d'annonce invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }
    // Vérifer si l'annonce existe
    const existingAnnouncement = await prisma.announcements.findUnique({
      where: { id: parseResult.data.id },
    });
    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: "Cette annonce n'existe pas." },
        { status: 404 }
      );
    }

    // mettre à jour l'annonce
    const announcement = await prisma.announcements.update({
      where: { id: parseResult.data.id },
      data: {
        title: parseResult.data.title ?? existingAnnouncement.title,
        content: parseResult.data.content ?? existingAnnouncement.content,
      },
    });

    // retirer l'id avant de renvoyer la réponse
    const { id, ...announcementWithoutId } = announcement;

    // renvoyer la réponse
    return NextResponse.json(
      { message: "Annonce mise à jour.", announcementWithoutId },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Utilisateur non authentifié." },
      { status: 401 }
    );
  }
}