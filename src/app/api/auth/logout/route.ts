import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

function extractTokenFromHeader(auth: string | null) {
  if (!auth) return null;

  let token: string | null = null;
  if (auth.startsWith("Bearer ")) {
    const rest = auth.slice("Bearer ".length);
    token = rest.includes("|") ? rest.split("|")[1].trim() : rest.trim();
  } else if (auth.includes("|")) {
    token = auth.split("|")[1].trim();
  } else {
    token = auth.trim();
  }

  return token || null;
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const token = extractTokenFromHeader(auth);

  // Stateless JWTs: nothing to revoke server-side by default.
  // We verify the token only to provide a helpful response for debug, but
  // even if verification fails we return success to keep logout idempotent.
  if (token) {
    try {
      await verifyToken(token);
    } catch {
      // token invalid or expired — ignore on logout
    }
  }

  return NextResponse.json({ message: "Déconnexion réussie" }, { status: 200 });
}
