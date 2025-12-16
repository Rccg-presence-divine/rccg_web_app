import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/read_notification/read?userId=123
export async function GET() {
  try {
    const readNotification = await prisma.read_Notifications.findMany({
        where: {
            read: true
        },
      include: {
        notification: {
          select: {
            title: true,
            message: true,
            dateSent: true,
          },
        },
      },
    });

    return NextResponse.json(readNotification,{ status: 200 });
  } catch (error) {
    console.error("GET /api/read_notification/read error", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des read_notifications." },
      { status: 500 }
    );
  }
}
