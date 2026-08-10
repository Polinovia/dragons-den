import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.passwordResetToken.create({
    data: { tokenHash, userId, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });

  return token;
}

export async function consumePasswordResetToken(token: string): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.expiresAt < new Date()) return null;

  await prisma.passwordResetToken.delete({ where: { tokenHash } });
  return { userId: record.userId };
}
