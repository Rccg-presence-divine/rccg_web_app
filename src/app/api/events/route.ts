import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  createEventsSchema,
  updateEventsSchema,
} from "@/validators/events.schema";

import { requireAuth, requireAnyRole } from "@/lib/auth";

// lister les événements
export async function GET() {
  try {
    await requireAuth();
    const events = await prisma.events.findMany();
    return NextResponse.json(
      { message: "Liste des événements chargés.", events },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des événements.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

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
        userId: userId,
        eventDate: new Date(),
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

// mettre à jour un événement
export async function PUT(req: Request) {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR", "MODERATOR"]);

    const body = await req.json();

    // Validation avec Zod
    const parseResult = updateEventsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données d'événement invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }
    // Vérifer si l'événement existe
    const existingEvent = await prisma.events.findUnique({
      where: { id: parseResult.data.id },
    });
    if (!existingEvent) {
      return NextResponse.json(
        { error: "Cet evénement n'existe pas." },
        { status: 404 }
      );
    }

    // mettre à jour l'annonce
    const event = await prisma.events.update({
      where: { id: parseResult.data.id },
      data: {
        title: parseResult.data.title ?? existingEvent.title,
        description: parseResult.data.description ?? existingEvent.description,
      },
    });

    // retirer l'id avant de renvoyer la réponse
    const { id, ...eventtWithoutId } = event;

    // renvoyer la réponse
    return NextResponse.json(
      { message: "Evénement mis à jour.", eventtWithoutId },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Utilisateur non authentifié." },
      { status: 401 }
    );
  }
}

// supprimer un événement
export async function DELETE(req: Request) {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR", "MODERATOR"]);
    const { id } = await req.json();
    const verifyEvent = await prisma.events.findUnique({
      where: { id: id },
    });
    if (!verifyEvent) {
      return NextResponse.json({ error: "Cet événement n'existe pas." });
    }
    await prisma.events.delete({
      where: { id: id },
    });
    return NextResponse.json("Evénement  supprimé avec succès.", {
      status: 200,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Accès interdit.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
