import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyOtpSchema } from "@/validators/otp.schema";
import { verifyOtp } from "@/lib/otp";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function POST(req: Request) {
  const body = await req.json();

  // 1. Validation Zod
  const parse = verifyOtpSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Format OTP invalide", details: parse.error.issues },
      { status: 400 }
    );
  }

  const { code } = parse.data;

  // 2. Récupérer le dernier OTP valide et non utilisé
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      used: false,
      expiresAt: { gt: new Date() }, // pas expiré
    },
    orderBy: { createdAt: "desc" },
    include: { user: true }, // récupérer l'utilisateur lié
  });

  if (!otpRecord) {
    return NextResponse.json(
      { error: "OTP expiré ou introuvable" },
      { status: 401 }
    );
  }

  // 3. Vérifier le code avec argon2
  const isValid = await verifyOtp(code, otpRecord.codeHash);
  if (!isValid) {
    return NextResponse.json(
      { error: "OTP incorrect" },
      { status: 401 }
    );
  }

  // 4. Marquer OTP comme utilisé
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  const user = otpRecord.user;

  // 5. Rotation : générer de nouveaux tokens
  const accessToken = await signAccessToken({ id: user.id, role: user.role });
  const newRefreshToken = await signRefreshToken({ id: user.id, role: user.role });

  // 6. Stocker la nouvelle session (rotation refresh token)
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: newRefreshToken,
      userAgent: req.headers.get("user-agent"),
      ipAddress: req.headers.get("x-forwarded-for"),
    },
  });

  // 7. Retourner tokens (refresh en cookie, access en header ou body)
  const res = NextResponse.json({
    message: "OTP validé, connexion réussie",
    accessToken,
  });

  res.cookies.set("refresh_token", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
