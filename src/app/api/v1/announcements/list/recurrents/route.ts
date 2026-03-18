import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const announcements = await prisma.announcements.findMany({
      where: { recurrent: true },
      orderBy: { datePosted: "desc" },
    });
    return NextResponse.json(
      { message: "List des annonces chargés.", announcements },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("GET /api/v1/announcements/list/recurrents error:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des annonces.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
