import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// lister les témoignages
export async function GET() {
  try {
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
