import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createTestimoniesSchema, updateTestimoniesSchema } from "@/validators/testimonies.schema";

// lister les témoignages
export async function GET() {
  try {
    const testimonies = await prisma.testimonies.findMany();
    return NextResponse.json({message: "Liste des témoignages chargés.",testimonies}, { status: 200 });
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

    // vérifier que l'utilisateur existe
    const user = await prisma.users.findUnique({
      where: { id: parseResult.data.userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé pour l'ID fourni." },
        { status: 400 }
      );
    }

    // créer le témoignage
    const created = await prisma.testimonies.create({
      data: {
        title: parseResult.data.title,
        content: parseResult.data.content,
        userId: parseResult.data.userId,
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
    return NextResponse.json({message: "Témoignage créé avec succès.",createdWithoutId}, { status: 201 });

}

// modifier un témoignage
export async function PUT(req: Request) {
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

    const existing = await prisma.testimonies.findUnique({
      where: { id: parseResult.data.id },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Témoignage introuvable." },
        { status: 404 }
      );

    const updated = await prisma.testimonies.update({
      where: { id: parseResult.data.id },
      data: {
        title: parseResult.data.title ?? existing.title,
        content: parseResult.data.content ?? existing.content,
        // userId is not updatable via schema, keep existing
        datePosted: existing.datePosted,
      },
    });

    const { id, ...updatedWithoutId } = updated;
    return NextResponse.json({message: "Témoignage modifié avec succès.",updatedWithoutId}, { status: 200 });
  
}

// Supprimer un témoignage
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const existing = await prisma.testimonies.findUnique({
      where: { id: id },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Témoignage introuvable." },
        { status: 404 }
      );
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
