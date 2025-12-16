import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// lister les événements
export async function GET() {
  try {
    const events = await prisma.events.findMany();
    return NextResponse.json(events, { status: 200 });
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
    const request = await req.json();
    const requiredUser = await prisma.users.findUnique({
      where: { id: request.userId },
    });
    if (!requiredUser) {
      return NextResponse.json(
        { error: "Cet utilisateur n'existe pas." },
        { status: 400 }
      );
    }
    const newEvent = await prisma.events.create({
      data: {
        title: request.title,
        description: request.description,
        userId: request.userId,
        eventDate: new Date(request.eventDate),
      },
    });
    const createNotification = await prisma.notifications.create({
      data: {
        title: "Un nouveau événement !",
        message: `Nouveau événement : ${newEvent.title} le ${newEvent.eventDate.toDateString()}`,
      },
    });

    // créer une notification de lecture pour tous les autres utilisateurs
    // prendre tous les utilisateurs sauf celui qui à créer l'annonce
    const otherUsers = await prisma.users.findMany({
      where: { id: { not: request.userId } },
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
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la création de l'événement.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// mettre à jour un événement
export async function PUT(req: Request) {
  try {
    const request = await req.json();
    const verifyEvent = await prisma.events.findUnique({
      where: { id: request.id },
    });
    if (!verifyEvent) {
      return NextResponse.json({ error: "Cet événement n'existe pas." });
    }
    const updatedEvent = await prisma.events.update({
      where: { id: request.id },
      data: {
        title: request.title ?? verifyEvent.title,
        description: request.description ?? verifyEvent.description,
        eventDate: request.eventDate ?? verifyEvent.eventDate,
      },
    });
    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la modification de l'événement.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// supprimer un événement
export async function DELETE(req: Request) {
  try {
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
        error: "Erreur lors de la suppression de l'événement.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
