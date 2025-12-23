import { cookies } from "next/headers";
import {
  signAccessToken,
  verifyRefreshToken,
  signRefreshToken,
} from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
// import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // // l'adresse IP du client
  // const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  // try {
  //   await rateLimit({
  //     ip,
  //     route: "REFRESH",
  //     limit: 5,
  //     windowMs: 10 * 60 * 1000, // 10 min
  //   });
  // } catch {
  //   return Response.json(
  //     { error: "Trop de tentatives, réessayez plus tard." },
  //     { status: 429 }
  //   );
  // }

  // Récupérer le refresh token depuis les cookies
  const cookieStore = await cookies();
  //
  const refreshToken = cookieStore.get("refresh_token")?.value;

  // Si pas de refresh token, renvoyer une erreur 401
  if (!refreshToken) {
    return NextResponse.json(
      { error: "Refresh token manquant" },
      { status: 401 }
    );
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });
  // Vérifier si le refresh token est révoqué ou n'existe pas
  if (!storedToken || storedToken.revoked) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  const payload = await verifyRefreshToken(refreshToken);

  // 🔁 rotation
  await prisma.refreshToken.update({
    where: { token: refreshToken },
    data: { revoked: true },
  });

  // Générer un nouveau refresh token et access token
  const user = await prisma.users.findUnique({
    where: { id: Number(payload.userId) },
  });
  const newAccessToken = await signAccessToken({
    id: user!.id,
    role: user!.role,
  });
  const newRefreshToken = await signRefreshToken({
    id: user!.id,
    role: user!.role,
  });

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: Number(payload.userId),
    },
  });

  const response = NextResponse.json({ accessToken: newAccessToken });

  response.cookies.set("refresh_token", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  });

  return NextResponse.json({ accessToken: newAccessToken });
  // Vérifier le refresh token
}
