import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "./lib/jwt";
import prisma from "./lib/prisma";
import { signAccessToken } from "./lib/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookiesStore = await cookies();

  // 1️⃣ Routes publiques (PAS de token requis)
  if (
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register") ||
    pathname.startsWith("/api/auth/forgot_password") ||
    pathname.startsWith("/api/auth/refresh") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2️⃣ Récupérer le header Authorization
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Non autorisé" },
      { status: 401 }
    );
  }
  // Lire l'access token
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
  const refreshToken = cookiesStore.get("refresh_token")?.value;
  // Si aucun refresh token et aucun access token,
  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // const token = authHeader.split(" ")[1];
  
  // Essayer de vérifier l’access token
  try {
    // 3️⃣ Vérifier le token
    // const { payload } = await jwtVerify(token, secret);
    const payload =  await verifyToken(accessToken!)

    // 4️⃣ Injecter l'utilisateur dans la requête
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", (payload.id).toString());
    requestHeaders.set("x-user-role", payload.role as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    // ⏳ Token expiré → on tente refresh token
  }
  // 5️⃣ Pas de refresh token
  if (!refreshToken) {
    return NextResponse.json({ error: "Session expirée" }, { status: 401 });
  }

  // 6️⃣ Vérifier refresh token en DB
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken || storedToken.revoked) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  // 7️⃣ Vérifier JWT refresh token
  let refreshPayload;
  try {
    refreshPayload = await verifyToken(refreshToken);
  } catch {
    return NextResponse.json({ error: "Refresh token invalide" }, { status: 401 });
  }

  // 8️⃣ Générer un nouvel access token
  const newAccessToken = await signAccessToken({
    id: Number(refreshPayload.id),
    role: refreshPayload.role,
  });

  // 9️⃣ Injecter les infos utilisateur
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("authorization", `Bearer ${newAccessToken}`);
  requestHeaders.set("x-user-id", String(refreshPayload.id));
  requestHeaders.set("x-user-role", refreshPayload.role);

   return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/api/:path*"],
};
