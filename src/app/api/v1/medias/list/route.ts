import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// liste les vidéos
export async function GET() {
  try {
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
