import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyRole } from "@/lib/auth";
// Récupérer tous les utilisateurs
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAnyRole(["SUPERADMIN", "PASTOR"]);
    const user = await prisma.users.findMany({
      select: {
        name: true,
        email: true,
        role: true,
        phone: true,
      },
      where: {
        id: Number(id),
      },
    });
    return NextResponse.json(
      { message: "Utilisateurs chargés.", user },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("GET /api/v1/users/list/[id] error:", error.message);
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
