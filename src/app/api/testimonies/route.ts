import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  createTestimoniesSchema,
  updateTestimoniesSchema,
} from "@/validators/testimonies.schema";
import { requireAnyRole, requireAuth } from "@/lib/auth";

// lister les témoignages
export async function GET() {
  try {
    await requireAuth();
    const testimonies = await prisma.testimonies.findMany();
    return NextResponse.json(
      { message: "Liste des témoignages chargés.", testimonies },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("GET /api/testimonies error:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des témoignages.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// créer un témoignage
export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();

    const body = await req.json();

    // Validation avec Zod
    const parseResult = createTestimoniesSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données de témoignage invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    // créer le témoignage
    const created = await prisma.testimonies.create({
      data: {
        title: parseResult.data.title,
        content: parseResult.data.content,
        userId: userId,
        datePosted: new Date(),
      },
    });

    // créer une notification générale
    const createNotification = await prisma.notifications.create({
      data: {
        title: "Un nouveau témoignage",
        message: `Titre : ${created.title}`,
      },
    });

    // créer une notification de lecture pour tous les autres utilisateurs
    const otherUsers = await prisma.users.findMany({
      where: { id: { not: created.userId } },
      select: { id: true },
    });
    if (otherUsers.length > 0) {
      const readData = otherUsers.map((u) => ({
        userId: u.id,
        notificationId: createNotification.id,
        read: false,
      }));
      await prisma.read_Notifications.createMany({
        data: readData,
        skipDuplicates: true,
      });
    }

    // renvoyer sans id
    const { id, ...createdWithoutId } = created;
    return NextResponse.json(
      { message: "Témoignage créé avec succès.", createdWithoutId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Utilisateur non authentifié." },
      { status: 401 }
    );
  }
}

// modifier un témoignage
export async function PUT(req: Request) {
  try {
    const { userId } = await requireAuth();

    const body = await req.json();

    // validation
    const parseResult = updateTestimoniesSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données de témoignage invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }
    // vérifier que le témoignage existe
    const existing = await prisma.testimonies.findUnique({
      where: { id: parseResult.data.id },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Témoignage introuvable." },
        { status: 404 }
      );
    // vérifier que l'utilisateur est le propriétaire du témoignage ou a un rôle élevé
    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas auteur de ce témoignage pour le modifier." },
        { status: 403 }
      );
    }

    const updated = await prisma.testimonies.update({
      where: { id: parseResult.data.id },
      data: {
        title: parseResult.data.title ?? existing.title,
        content: parseResult.data.content ?? existing.content,
        datePosted: existing.datePosted,
      },
    });

    const { id, ...updatedWithoutId } = updated;
    return NextResponse.json(
      { message: "Témoignage modifié avec succès.", updatedWithoutId },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Utilisateur non authentifié." },
      { status: 401 }
    );
  }
}

// Supprimer un témoignage
export async function DELETE(req: Request) {
  try {
    const { userId } = await requireAuth();
    const { id } = await req.json();
    const existing = await prisma.testimonies.findUnique({
      where: { id: id },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Témoignage introuvable." },
        { status: 404 }
      );
    // vérifier que l'utilisateur est le propriétaire du témoignage ou a un rôle élevé
    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer ce témoignage." },
        { status: 403 }
      );
    }
    await prisma.testimonies.delete({
      where: { id: id },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/testimonies error", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression." },
      { status: 500 }
    );
  }
}
