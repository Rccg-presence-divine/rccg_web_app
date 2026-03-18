import {NextResponse} from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, {params}: {params: Promise<{id: string}>}) {
    const { id } = await params;
    
    const category = await prisma.categories.findUnique({
        where: {
            id: Number(id)
        }
    });
    return NextResponse.json(category);
}
