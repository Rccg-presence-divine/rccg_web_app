import prisma from "@/lib/prisma";
import { headers } from "next/headers";
export async function GET() {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");

  const sessions = await prisma.session.findMany({
    where: {
      userId: Number(userId),
      revoked: false,
    },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return Response.json(sessions);
}
