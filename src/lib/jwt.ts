import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

export type JwtPayload = {
  id: number;
  role: "SUPERADMIN" | "PASTOR" | "MODERATOR" | "USER";
};
/* =========================
   ACCESS TOKEN (court)
========================= */
export async function signAccessToken(payload: JwtPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m") // ⏱️ court
    .sign(secret);
}
// vérifier le token d'accès
export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as JwtPayload;
}

/* =========================
   REFRESH TOKEN (long)
========================= */
export async function signRefreshToken(payload: JwtPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn) // ⏱️ long
    .sign(refreshSecret);
}

// vérifier le refresh token
export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, refreshSecret);
  return payload;
}
