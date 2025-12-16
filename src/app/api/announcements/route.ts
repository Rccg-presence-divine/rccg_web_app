import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// lister les annonces
export async function GET() {
  try {
    const announcements = await prisma.announcements.findMany();
    return NextResponse.json(announcements, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des annonces.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// créer une annonce
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
    const newAnnouncement = await prisma.announcements.create({
      data: {
        title: request.title,
        content: request.content,
        userId: request.userId,
        datePosted: new Date(),
      },
    });
    const createNotification = await prisma.notifications.create({
      data: {
        title: "Vous avez reçu une nouvelle annonce !",
        message: `Titre de l'annonce : ${newAnnouncement.title}`,
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
    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la création de l'annonce.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// mettre à jour une annonce
export async function PUT(req: Request) {
  try {
    const request = await req.json();
    const existingAnnouncement = await prisma.announcements.findUnique({
      where: { id: request.id },
    });
    if (!existingAnnouncement) {
      return NextResponse.json({ error: "Cette annonce n'existe pas." });
    }
    const updatedAnnouncement = await prisma.announcements.update({
      where: { id: request.id },
      data: {
        title: request.title ?? existingAnnouncement.title,
        content: request.content ?? existingAnnouncement.content,
        datePosted: request.datePosted ?? existingAnnouncement.datePosted,
      },
    });
    return NextResponse.json(updatedAnnouncement, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jours de l'annonce.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
// supprimer une annonce
export async function DELETE(req: Request) {
  try {
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
        error: "Erreur lors de la suppression de l'annonce.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
