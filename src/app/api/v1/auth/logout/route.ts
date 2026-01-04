import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie");

  const refreshToken = cookieHeader
    ?.split("; ")
    .find((c) => c.startsWith("refresh_token="))
    ?.split("=")[1];

  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }
  console.log(refreshToken);

  // Supprimer les sessions associées au refresh token
  await prisma.session.updateMany({
    where: {
      refreshToken,
      revoked: false,
    },
    data: { revoked: true },
  });
  const response = NextResponse.json(
    { message: "Vous vous êtes déconnecté" },
    { status: 200 }
  );

  response.cookies.delete("refresh_token");

  return response;
}


async function logOutAllSessions(userId: number) {
  await prisma.session.updateMany({
  where: {
    userId: userId,
    revoked: false,
  },
  data: { revoked: true },
});
}