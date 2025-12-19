import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  createMediaSchema,
  updateMediaSchema,
} from "@/validators/medias.schema";
import { requireAnyRole, requireAuth } from "@/lib/auth";

// liste les vidéos
export async function GET() {
  try {
    await requireAuth();
    const medias = await prisma.medias.findMany({
      include: {
        category: {
          select: { title: true },
        },
      },
    });
    return NextResponse.json(
      { message: "Liste des vidéos chargées.", medias },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des vidéos.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

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
// modifier une vidéo
export async function PUT(req: Request) {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR", "MODERATOR"]);

    const body = await req.json();

    // validation
    const parseResult = updateMediaSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données du média invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const existingVideo = await prisma.medias.findUnique({
      where: { id: parseResult.data.id },
    });
    if (!existingVideo) {
      return NextResponse.json(
        { error: "Média introuvable." },
        { status: 404 }
      );
    }

    // si categoryId est fourni, vérifier son existence
    if (parseResult.data.categoryId) {
      const verifyCategory = await prisma.categories.findUnique({
        where: { id: parseResult.data.categoryId },
      });
      if (!verifyCategory) {
        return NextResponse.json(
          { error: "Categorie introuvable." },
          { status: 404 }
        );
      }
    }

    const updatedVideo = await prisma.medias.update({
      where: { id: parseResult.data.id },
      data: {
        title: parseResult.data.title ?? existingVideo.title,
        description: parseResult.data.description ?? existingVideo.description,
        preacher: parseResult.data.preacher ?? existingVideo.preacher,
        youtubeID: parseResult.data.youtubeID ?? existingVideo.youtubeID,
        mediaUrl: parseResult.data.mediaUrl ?? existingVideo.mediaUrl,
        isVideo: parseResult.data.isVideo ?? existingVideo.isVideo,
        categoryId: parseResult.data.categoryId ?? existingVideo.categoryId,
        thumbnailUrl:
          parseResult.data.thumbnailUrl ?? existingVideo.thumbnailUrl,
      },
    });

    const { id, ...videoWithoutId } = updatedVideo;
    return NextResponse.json(
      { message: "Média modifié avec succès.", videoWithoutId },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Utilisateur non authentifié." },
      { status: 401 }
    );
  }
}

// supprimer une vidéo
export async function DELETE(req: Request) {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR"])
    const { id } = await req.json();
    const existingVideo = await prisma.medias.findUnique({
      where: { id: id },
    });
    if (!existingVideo) {
      return NextResponse.json(
        { error: "Media introuvable." },
        { status: 404 }
      );
    }
    await prisma.medias.delete({
      where: { id: id },
    });
    return NextResponse.json(
      { message: "Média supprimée avec succès." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Vous n'avez pas la permission de supprimer la vidéo.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
