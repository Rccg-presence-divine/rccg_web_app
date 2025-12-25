import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyRole } from "@/lib/auth";
// Récupérer tous les utilisateurs
export async function GET() {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR"]);
    const users = await prisma.users.findMany({
      select:{
        name: true,
        email: true,
        role: true,
        phone: true,
      }
    });
    return NextResponse.json(
      { message: "Utilisateurs chargés.", users },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des utilisateurs.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
