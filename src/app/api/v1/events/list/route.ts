import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// lister les événements
export async function GET() {
  try {
    const events = await prisma.events.findMany();
    return NextResponse.json(
      { message: "Liste des événements chargés.", events },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des événements.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
