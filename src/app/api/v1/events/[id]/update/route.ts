import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { updateEventsSchema } from "@/validators/events.schema";
import { requireAnyRole } from "@/lib/auth";

// mettre à jour un événement
export async function PUT(req: Request) {
  try {
    await requireAnyRole(["SUPERADMIN", "PASTOR", "MODERATOR"]);

    const body = await req.json();

    // Validation avec Zod
    const parseResult = updateEventsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données d'événement invalides.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }
    // Vérifer si l'événement existe
    const existingEvent = await prisma.events.findUnique({
      where: { id: parseResult.data.id },
    });
    if (!existingEvent) {
      return NextResponse.json(
        { error: "Cet evénement n'existe pas." },
        { status: 404 }
      );
    }

    // mettre à jour l'annonce
    const event = await prisma.events.update({
      where: { id: parseResult.data.id },
      data: {
        title: parseResult.data.title ?? existingEvent.title,
        description: parseResult.data.description ?? existingEvent.description,
        eventDate: parseResult.data.eventDate ?? existingEvent.eventDate,
        location: parseResult.data.location ?? existingEvent.location,
      },
    });

    // retirer l'id avant de renvoyer la réponse
    const { id, ...eventtWithoutId } = event;

    // renvoyer la réponse
    return NextResponse.json(
      { message: "Evénement mis à jour.", eventtWithoutId },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Utilisateur non authentifié." },
      { status: 401 }
    );
  }
}
