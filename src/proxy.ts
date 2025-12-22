import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/jwt";
// import { cookies } from "next/headers";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1️⃣ Routes publiques (PAS de token requis)
  if (
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/test-db") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2️⃣ Récupérer le header Authorization
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    // 3️⃣ Vérifier le token
    const payload = await verifyToken(accessToken);

    // 4️⃣ Injecter l'utilisateur dans la requête
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", payload.id.toString());
    requestHeaders.set("x-user-role", payload.role as string);

    // const cookiesStore = await cookies();
    // console.log("🍪 Tous les cookies:", cookiesStore.getAll());
    // const refreshToken = cookiesStore.get("refresh_token")?.value;
    // console.log("🔑 Refresh token trouvé:", refreshToken);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Token invalide ou expiré" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
