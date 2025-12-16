import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// liste les vidéos
export async function GET() {
  try {
    const videos = await prisma.videos.findMany({
      include: {
        category: {
          select: { title: true },
        },
      },
    });
    return NextResponse.json(videos, { status: 200 });
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
    const request = await req.json();
    // vérifier l'existence de l'utilisateur et de la catégorie
    const verifyUser = await prisma.users.findUnique({
      where: { id: request.userId },
    });
    if (!verifyUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }
    // vérifier l'existence de la catégorie
    const verifyCategory = await prisma.categories.findUnique({
      where: { id: request.categoryId },
    });
    if (!verifyCategory) {
      return NextResponse.json(
        { error: "Categorie introuvable." },
        { status: 404 }
      );
    }
    // créer la vidéo
    const newVideo = await prisma.videos.create({
      data: {
        title: request.title,
        description: request.description,
        preacher: request.preacher,
        youtubeID: request.youtubeID,
        videoUrl: request.videoUrl,
        audioUrl: request.audioUrl,
        userId: request.userId,
        categoryId: request.categoryId,
        thumbnailUrl: request.thumbnailUrl,
        datePreached: new Date(request.datePreached),
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
    return NextResponse.json(newVideo, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la création de la vidéo.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
// modifier une vidéo
export async function PUT(req: Request) {
  try {
    const request = await req.json();
    const existingVideo = await prisma.videos.findUnique({
      where: { id: request.id },
    });
    if (!existingVideo) {
      return NextResponse.json(
        { error: "Vidéo introuvable." },
        { status: 404 }
      );
    }
    const updatedVideo = await prisma.videos.update({
      where: { id: request.id },
      data: {
        title: request.title ?? existingVideo.title,
        description: request.description ?? existingVideo.description,
        preacher: request.preacher ?? existingVideo.preacher,
        youtubeID: request.youtubeID ?? existingVideo.youtubeID,
        videoUrl: request.videoUrl ?? existingVideo.videoUrl,
        audioUrl: request.audioUrl ?? existingVideo.audioUrl,
        userId: request.userId ?? existingVideo.userId,
        categoryId: request.categoryId ?? existingVideo.categoryId,
        thumbnailUrl: request.thumbnailUrl ?? existingVideo.thumbnailUrl,
      },
    });
    return NextResponse.json(updatedVideo, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la modification de la vidéo.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// supprimer une vidéo
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const existingVideo = await prisma.videos.findUnique({
      where: { id: id },
    });
    if (!existingVideo) {
      return NextResponse.json(
        { error: "Vidéo introuvable." },
        { status: 404 }
      );
    }
    await prisma.videos.delete({
      where: { id: id },
    });
    return NextResponse.json(
      { message: "Vidéo supprimée avec succès." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la suppression de la vidéo.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
