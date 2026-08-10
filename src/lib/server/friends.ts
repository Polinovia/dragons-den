import { prisma } from "@/lib/prisma";
import { FriendshipStatus } from "@prisma/client";
import type { Viewer } from "@/lib/server/visibility";

export async function getFriendIds(userId: string): Promise<string[]> {
  const rows = await prisma.friendship.findMany({
    where: {
      status: FriendshipStatus.ACCEPTED,
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  return rows.map((row) => (row.requesterId === userId ? row.addresseeId : row.requesterId));
}

export type FriendshipState = "SELF" | "FRIENDS" | "REQUEST_SENT" | "REQUEST_RECEIVED" | "NONE";

export async function getFriendshipState(viewer: Viewer, profileUserId: string): Promise<FriendshipState> {
  if (!viewer) return "NONE";
  if (viewer.id === profileUserId) return "SELF";

  const row = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: viewer.id, addresseeId: profileUserId },
        { requesterId: profileUserId, addresseeId: viewer.id },
      ],
    },
    select: { requesterId: true, status: true },
  });

  if (!row) return "NONE";
  if (row.status === FriendshipStatus.ACCEPTED) return "FRIENDS";
  if (row.status === FriendshipStatus.PENDING) {
    return row.requesterId === viewer.id ? "REQUEST_SENT" : "REQUEST_RECEIVED";
  }
  return "NONE";
}

export async function sendFriendRequest(requesterId: string, addresseeUsername: string) {
  const addressee = await prisma.user.findUnique({
    where: { username: addresseeUsername },
    select: { id: true },
  });
  if (!addressee || addressee.id === requesterId) return null;

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId: addressee.id },
        { requesterId: addressee.id, addresseeId: requesterId },
      ],
    },
  });
  if (existing) return existing;

  return prisma.friendship.create({
    data: { requesterId, addresseeId: addressee.id, status: FriendshipStatus.PENDING },
  });
}

export async function respondToFriendRequest(userId: string, requesterId: string, accept: boolean) {
  const friendship = await prisma.friendship.findFirst({
    where: { requesterId, addresseeId: userId, status: FriendshipStatus.PENDING },
  });
  if (!friendship) return null;

  return prisma.friendship.update({
    where: { id: friendship.id },
    data: {
      status: accept ? FriendshipStatus.ACCEPTED : FriendshipStatus.DECLINED,
      respondedAt: new Date(),
    },
  });
}
