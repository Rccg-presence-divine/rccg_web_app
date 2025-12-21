import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  await requireRole("SUPERADMIN");
  await prisma.rateLimit.deleteMany({
    where: { resetAt: { lt: new Date() } },
  });

  return Response.json({ success: true });
}
