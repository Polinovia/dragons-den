import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { SecurityQuestionValue } from "@/lib/security-questions";

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

export async function findUserByEmailOrUsername(email: string, username: string) {
  return prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email }, select: { id: true } });
}

export async function updateUserPassword(userId: string, password: string) {
  const passwordHash = await hashPassword(password);
  return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function createUser(data: {
  email: string;
  username: string;
  password: string;
  displayName: string;
  securityQuestion: SecurityQuestionValue;
  securityAnswer: string;
}) {
  const [passwordHash, securityAnswerHash] = await Promise.all([
    hashPassword(data.password),
    hashPassword(normalizeAnswer(data.securityAnswer)),
  ]);
  return prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      passwordHash,
      securityQuestion: data.securityQuestion,
      securityAnswerHash,
      profile: { create: { displayName: data.displayName } },
    },
  });
}

export async function getSecurityQuestionForEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { securityQuestion: true },
  });
  if (!user?.securityQuestion) return null;
  return { question: user.securityQuestion };
}

export async function verifySecurityAnswer(email: string, answer: string): Promise<{ userId: string } | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, securityAnswerHash: true },
  });
  if (!user?.securityAnswerHash) return null;

  const matches = await verifyPassword(normalizeAnswer(answer), user.securityAnswerHash);
  return matches ? { userId: user.id } : null;
}
