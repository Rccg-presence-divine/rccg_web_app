import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createEventsSchema } from "@/validators/events.schema";
import { requireAnyRole } from "@/lib/auth";

// créer un événement
export async function POST(req: Request) {
  try {
    const { userId } = await requireAnyRole([
      "SUPERADMIN",
      "PASTOR",
      "MODERATOR",
    ]);

    const body = await req.json();

    // Validation avec Zod
    const parseResult = createEventsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données d'événement invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    // créer l'événement
    const event = await prisma.events.create({
      data: {
        title: parseResult.data.title,
        description: parseResult.data.description,
        eventDate: parseResult.data.eventDate,
        userId: userId,
        location: parseResult.data.location,
      },
    });

    // Créer la notification associée
    const createNotification = await prisma.notifications.create({
      data: {
        title: "Un événement approche !",
        message: event.title,
      },
    });

    // créer une notification de lecture pour tous les autres utilisateurs
    // prendre tous les utilisateurs sauf celui qui à créer l'annonce
    const otherUsers = await prisma.users.findMany({
      where: { id: { not: event.userId } },
      select: { id: true },
    });
    // s'il y a d'autres utilisateurs, créer les entrées de notification de lecture
    if (otherUsers.length > 0) {
      // créer une notification de lecture pour tous les autres utilisateurs
      const readData = otherUsers.map((u) => ({
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

    // afficher l'événement créer sans id
    const { id, ...eventtWithoutId } = event;
    // renvoyer la réponse
    return NextResponse.json(
      { message: "Evénement crée.", eventtWithoutId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Utilisateur non authentifié." },
      { status: 401 }
    );
  }
}
