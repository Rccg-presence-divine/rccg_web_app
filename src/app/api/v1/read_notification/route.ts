import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// lister les notifications

export async function GET() {
  try {
    const notifications = await prisma.read_Notifications.findMany({
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
    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("GET /api/read_notification error:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des notifications.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

//mise à jour d'une notification
export async function PUT(req: Request) {
  try {
    const { id } = await req.json();
    const existingNotification = await prisma.read_Notifications.findUnique({
      where: { id: id },
    });
    if (!existingNotification) {
      return NextResponse.json({ error: "Cette notification n'existe pas." });
    }
    const updatedNotification = await prisma.read_Notifications.update({
      where: { id: id },
      data: {
        read: true,
      },
    });
    return NextResponse.json(updatedNotification, { status: 200 });
  } catch (error) {
    console.error("PUT /api/read_notification error");
    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour de la notification.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// suppimer une notification
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const existingNotification = await prisma.read_Notifications.findUnique({
      where: { id: id },
    });
    if (!existingNotification) {
      return NextResponse.json(
        { error: "Cette notification n'existe pas." },
        { status: 404 }
      );
    }
    await prisma.read_Notifications.delete({
      where: { id: id },
    });
    return NextResponse.json(
      { message: "Notification supprimée avec succès." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("DELETE /api/read_notification error:", error.message);
    }
    return NextResponse.json(
      {
        error: "Erreur lors de la suppression de la notification.",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
