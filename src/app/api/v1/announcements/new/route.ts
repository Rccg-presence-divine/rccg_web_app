import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAnnouncementsSchema } from "@/validators/announcements.schema";
import { requireAnyRole } from "@/lib/auth";
// créer une annonce
export async function POST(req: Request) {
  try {
    const { userId } = await requireAnyRole([
      "SUPERADMIN",
      "PASTOR",
      "MODERATOR",
    ]);
    const body = await req.json();

    // Validation avec Zod
    const parseResult = createAnnouncementsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données d'annonce invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    // créer l'annonce
    const announcement = await prisma.announcements.create({
      data: {
        title: parseResult.data.title,
        content: parseResult.data.content,
        userId: userId,
        datePosted: new Date(),
      },
    });

    // Créer la notification associée
    const createNotification = await prisma.notifications.create({
      data: {
        title: "Vous avez une nouvelle annonce !",
        message: "Une nouvelle annonce a été publier : " + announcement.title,
      },
    });

    // créer une notification de lecture pour tous les autres utilisateurs
    // prendre tous les utilisateurs sauf celui qui à créer l'annonce
    const otherUsers = await prisma.users.findMany({
      where: { id: { not: userId } },
      select: { id: true },
    });
    // s'il y a d'autres utilisateurs, créer les entrées de notification de lecture
    if (otherUsers.length > 0) {
      // créer une notification de lecture pour tous les autres utilisateurs
      const readData = otherUsers.map((u: {id: number}) => ({
        userId: u.id,
        notificationId: createNotification.id,
        read: false,
      }));
      // insérer en masse les entrées de notification de lecture
      await prisma.read_Notifications.createMany({
        data: readData,
        skipDuplicates: true,
      });
    }

    // afficher l'annonce créer sans id
    const { id, ...announcementWithoutId } = announcement;
    // renvoyer la réponse
    return NextResponse.json(
      { message: "Annonce crée.", announcementWithoutId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Utilisateur non authentifié." },
      { status: 401 }
    );
  }
}
