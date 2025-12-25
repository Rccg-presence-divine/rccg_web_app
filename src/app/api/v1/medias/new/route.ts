import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createMediaSchema } from "@/validators/medias.schema";
import { requireAnyRole } from "@/lib/auth";

// créer une vidéo
export async function POST(req: Request) {
  try {
    const { userId } = await requireAnyRole([
      "SUPERADMIN",
      "PASTOR",
      "MODERATOR",
    ]);

    const body = await req.json();

    // coerce date string to Date for zod
    const parseResult = createMediaSchema.safeParse({
      ...body,
      datePreached: body.datePreached
        ? new Date(body.datePreached)
        : new Date(),
    });
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données de vidéo invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    // vérifier l'existence de la catégorie
    const verifyCategory = await prisma.categories.findUnique({
      where: { id: parseResult.data.categoryId },
    });
    if (!verifyCategory) {
      return NextResponse.json(
        { error: "Categorie introuvable." },
        { status: 404 }
      );
    }

    // créer la vidéo
    const newVideo = await prisma.medias.create({
      data: {
        title: parseResult.data.title,
        description: parseResult.data.description,
        preacher: parseResult.data.preacher,
        youtubeID: parseResult.data.youtubeID,
        mediaUrl: parseResult.data.mediaUrl,
        isVideo: parseResult.data.isVideo,
        userId: userId,
        categoryId: parseResult.data.categoryId,
        thumbnailUrl: parseResult.data.thumbnailUrl,
        datePreached: parseResult.data.datePreached,
      },
    });

    const createNotification = await prisma.notifications.create({
      data: {
        title: `Prédication du ${newVideo.datePreached.toDateString()} !`,
        message: `Nouvelle prédication : ${newVideo.title}`,
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

    // renvoyer sans id
    const { id, ...videoWithoutId } = newVideo;
    return NextResponse.json(
      { message: "Vidéo crée avec succès.", videoWithoutId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Utilisateur non authentifié." },
      { status: 401 }
    );
  }
}
