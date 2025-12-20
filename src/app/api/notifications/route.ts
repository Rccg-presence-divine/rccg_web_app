import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Minimal implementation to satisfy Next.js type generation
    return NextResponse.json(
      { message: "Aucune notification disponible.", notifications: [] },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
