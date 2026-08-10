import { prisma } from "@/lib/prisma";

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean }> {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimitAttempt.findUnique({ where: { key } });

    if (!existing || existing.resetAt <= now) {
      await tx.rateLimitAttempt.upsert({
        where: { key },
        create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
        update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
      });
      return { allowed: true };
    }

    if (existing.count >= limit) {
      return { allowed: false };
    }

    await tx.rateLimitAttempt.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { allowed: true };
  });
}
