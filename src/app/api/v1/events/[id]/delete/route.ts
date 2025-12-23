import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAnyRole } from "@/lib/auth";
// supprimer un événement
export async function DELETE(req: Request) {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR", "MODERATOR"]);
    const { id } = await req.json();
    const verifyEvent = await prisma.events.findUnique({
      where: { id: id },
    });
    if (!verifyEvent) {
      return NextResponse.json({ error: "Cet événement n'existe pas." });
    }
    await prisma.events.delete({
      where: { id: id },
    });
    return NextResponse.json("Evénement  supprimé avec succès.", {
      status: 200,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      {
        error: "Accès interdit.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
