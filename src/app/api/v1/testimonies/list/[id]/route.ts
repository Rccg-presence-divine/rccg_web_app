import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params}: {params: Promise<{id: string}>}) {
  try {
    const id = await params;
    const testimony = await prisma.testimonies.findFirst({
      where: { id: Number(id) },
    });
    return NextResponse.json({ testimony }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("GET /api/v1/testimonies/list/[id] error:", error.message);
    }
    return NextResponse.json(
      { error: "Erreur lors de la recherche." },
      { status: 500 }
    );
  }
}
