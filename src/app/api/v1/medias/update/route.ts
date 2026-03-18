import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateMediaSchema } from "@/validators/medias.schema";
import { requireAnyRole } from "@/lib/auth";

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
