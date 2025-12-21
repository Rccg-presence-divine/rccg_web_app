// import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";
import prisma from "./prisma";

// // Initialize Redis with your Upstash REST URL and Token ²/
// const redis = new Redis({
//     url: process.env.UPSTASH_REDIS_REST_URL!,
//     token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// })

// // Create a new ratelimiter, that allows 5 requests per 1 minute
// export const authRateLimit = new Ratelimit({
//     redis,
//     limiter: Ratelimit.slidingWindow(5, "1 m"),
//     analytics: true,
// });

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
