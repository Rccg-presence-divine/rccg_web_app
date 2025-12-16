import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// lister les témoignages
export async function GET() {
  try {
    const testimonies = await prisma.testimonies.findMany();
    return NextResponse.json(testimonies, { status: 200 });
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
    const request = await req.json();

    const user = await prisma.users.findUnique({
      where: { id: request.userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé pour l'ID fourni." },
        { status: 400 }
      );
    }
    const created = await prisma.testimonies.create({
      data: {
        title: request.title,
        content: request.content,
        userId: request.userId,
        datePosted: new Date(),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("POST /api/testimonies error", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la création du témoignage.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// modifier un témoignage
export async function PUT(req: Request) {
  try {
    const request = await req.json();
    const existing = await prisma.testimonies.findUnique({
      where: { id: request.id },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Témoignage introuvable." },
        { status: 404 }
      );
    const newTestimony = await prisma.testimonies.update({
      where: { id: request.id },
      data: {
        title: request.title ?? existing.title,
        content: request.content ?? existing.content,
        userId: request.userId ?? existing.userId,
        datePosted: existing.datePosted,
      },
    });
    return NextResponse.json(newTestimony, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("PUT /api/testimonies error", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour de la catégorie.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
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
