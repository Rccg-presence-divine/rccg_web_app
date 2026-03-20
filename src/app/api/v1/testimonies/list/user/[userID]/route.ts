import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userID: string }> }
) {
  try {
    const { userID } = await params;
    const mytestimonies = await prisma.testimonies.findMany({
      where: {
        userId: Number(userID),
        approved: true,
      },
      orderBy: {
        datePosted: "desc",
      },
    });
    if (mytestimonies.length === 0) {
      return NextResponse.json({ message: "Aucun témoignage." }, { status: 404 });
    }
    return NextResponse.json({ mytestimonies }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "GET /api/v1/testimonies/list/[userID] error:",
        error.message
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de la récupération des témoignages." },
      { status: 500 }
    );
  }
}
