import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export async function createNotification(input: {
  recipientId: string;
  actorId?: string | null;
  type: NotificationType;
  message: string;
  link: string;
}) {
  if (input.actorId === input.recipientId) return null;
  return prisma.notification.create({
    data: {
      recipientId: input.recipientId,
      actorId: input.actorId ?? null,
      type: input.type,
      message: input.message,
      link: input.link,
    },
  });
}

export async function listNotificationsForUser(userId: string, take = 20) {
  return prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      actor: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
    },
  });
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { recipientId: userId, isRead: false } });
}

export async function markNotificationRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, recipientId: userId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true },
  });
}
