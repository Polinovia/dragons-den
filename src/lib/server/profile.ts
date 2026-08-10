import { prisma } from "@/lib/prisma";
import type { Viewer } from "@/lib/server/visibility";
import { getFriendIds, getFriendshipState } from "@/lib/server/friends";
import { toAuthorSummary } from "@/lib/server/mappers";
import { listSketchesByAuthorForViewer } from "@/lib/server/sketches";
import { listStoriesForAuthorOrContributor } from "@/lib/server/stories";
import { listThoughtsByAuthorForViewer } from "@/lib/server/thoughts";
import { listCollectionsForOwnerOrContributor } from "@/lib/server/collections";

export async function getProfileByUsername(username: string, viewer: Viewer) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      createdAt: true,
      profile: { select: { displayName: true, avatarUrl: true, bio: true, locale: true } },
    },
  });
  if (!user) return null;

  const [friendIds, friendshipState, sketches, stories, thoughts, collections] = await Promise.all([
    getFriendIds(user.id),
    getFriendshipState(viewer, user.id),
    listSketchesByAuthorForViewer(user.id, viewer, 12),
    listStoriesForAuthorOrContributor(user.id, viewer, 12),
    listThoughtsByAuthorForViewer(user.id, viewer, 12),
    listCollectionsForOwnerOrContributor(user.id, viewer, 12),
  ]);

  return {
    ...toAuthorSummary(user),
    bio: user.profile?.bio ?? null,
    locale: user.profile?.locale ?? "en",
    memberSince: user.createdAt,
    friendCount: friendIds.length,
    friendshipState,
    sketches,
    stories,
    thoughts,
    collections,
  };
}

export type ProfileDetail = NonNullable<Awaited<ReturnType<typeof getProfileByUsername>>>;

export async function updateProfile(
  userId: string,
  data: { displayName: string; bio?: string | null; locale?: string },
) {
  return prisma.profile.update({
    where: { userId },
    data: { displayName: data.displayName, bio: data.bio ?? null, ...(data.locale ? { locale: data.locale } : {}) },
  });
}
