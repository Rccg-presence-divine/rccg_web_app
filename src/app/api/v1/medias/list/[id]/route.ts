import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const media = await prisma.medias.findFirst({
      where: { id: Number(id) },
    });
    return NextResponse.json({ media }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("GET /api/v1/medias/list/[id] error:", error.message);
    }
    return NextResponse.json(
      { error: "Erreur lors de la recherche." },
      { status: 500 }
    );
  }
}
