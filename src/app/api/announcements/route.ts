import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  createAnnouncementsSchema,
  updateAnnouncementsSchema,
} from "@/validators/announcements.schema";
import { requireAuth, requireAnyRole } from "@/lib/auth";

// lister les annonces
export async function GET() {
  try {
    await requireAuth();
    const announcements = await prisma.announcements.findMany();
    return NextResponse.json(
      { message: "List des annonces chargés.", announcements },
      { status: 200 }
    );
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
