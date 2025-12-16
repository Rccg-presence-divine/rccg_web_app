import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// lister les annonces
export async function GET() {
  try {
    const categories = await prisma.categories.findMany();
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des catégories.",
        detail:
          process.env.MODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// créer une catégorie
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
    const newCategory = await prisma.categories.create({
      data: {
        title: request.title,
        description: request.description,
        userId: request.userId,
      },
    });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json({
      error: "Erreur lors de la création de la catégorie.",
      details:
        process.env.NODE_ENV === "development" ? String(error) : undefined,
    });
  }
}
// mettre à jour une catégorie
export async function PUT(req: Request) {
  try {
    const request = await req.json();
    const verifyCategory = await prisma.categories.findUnique({
      where: { id: request.id },
    });
    if (!verifyCategory) {
      return NextResponse.json({ error: "Cette categorie n'existe pas." });
    }
    const updatedCategory = await prisma.categories.update({
      where: { id: request.id },
      data: {
        title: request.title ?? verifyCategory.title,
        description: request.description ?? verifyCategory.description,
      },
    });
    return NextResponse.json(updatedCategory, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
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
