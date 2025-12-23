
import prisma from "./prisma";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  ip: string;
  route: string;
};

export async function rateLimit({
  limit,
  windowMs,
  ip,
  route,
}: RateLimitOptions) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  const existing = await prisma.rateLimit.findUnique({
    where: { ip_route: { ip, route } },
  });

  // première requête
  if (!existing || existing.resetAt < now) {
    await prisma.rateLimit.upsert({
      where: { ip_route: { ip, route } },
      update: {
        count: 1,
        resetAt,
      },
      create: {
        count: 1,
        resetAt,
        ip,
        route,
      },
    });
    return;
  }
  // Limite atteinte
  if (existing.count >= limit) {
    throw new Error("TOO_MANY_REQUESTS");
  }

  // Incrément
  await prisma.rateLimit.update({
    where: { ip_route: { ip, route } },
    data: { count: { increment: 1 } },
  });
}
