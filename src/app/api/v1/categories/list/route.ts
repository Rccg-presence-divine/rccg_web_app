import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyRole } from "@/lib/auth";

// lister les catégories
export async function GET() {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR", "MODERATOR"]);
    const categories = await prisma.categories.findMany();
    return NextResponse.json(
      { message: "Liste des catégories chargés.", categories },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      if (error.message === "Accès interdit") {
        return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
      }
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
