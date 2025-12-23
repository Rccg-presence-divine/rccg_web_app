import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createTestimoniesSchema } from "@/validators/testimonies.schema";
import { requireAuth } from "@/lib/auth";

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
