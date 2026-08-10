import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function findUserByEmailOrUsername(email: string, username: string) {
  return prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
}

export async function createUser(data: {
  email: string;
  username: string;
  password: string;
  displayName: string;
}) {
  const passwordHash = await hashPassword(data.password);
  return prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      passwordHash,
      profile: { create: { displayName: data.displayName } },
    },
  });
}
