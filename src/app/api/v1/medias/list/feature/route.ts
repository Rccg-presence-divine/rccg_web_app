import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const medias = await prisma.medias.findFirst({
            where: { featured: true },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ message: "List des médias chargés.", medias }, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error details:", error.message);
        }
        return NextResponse.json(
            {
                error: "Erreur lors de la récupération des médias.",
                details: process.env.NODE_ENV === "development" ? String(error) : undefined,
            },
            { status: 500 }
        );
    }
}