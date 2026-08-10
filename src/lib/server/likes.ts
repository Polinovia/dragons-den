import { prisma } from "@/lib/prisma";
import { ContentType } from "@prisma/client";
import type { Viewer } from "@/lib/server/visibility";
import { canView } from "@/lib/server/visibility";
import { getFriendIds } from "@/lib/server/friends";
import type { ContentTarget } from "@/lib/server/comments";

async function loadTargetContent(target: ContentTarget) {
  switch (target.contentType) {
    case ContentType.SKETCH:
      return prisma.sketch.findUnique({ where: { id: target.id } });
    case ContentType.STORY:
      return prisma.story.findUnique({ where: { id: target.id } });
    case ContentType.THOUGHT:
      return prisma.thought.findUnique({ where: { id: target.id } });
  }
}

function fkField(contentType: ContentType): "sketchId" | "storyId" | "thoughtId" {
  switch (contentType) {
    case ContentType.SKETCH:
      return "sketchId";
    case ContentType.STORY:
      return "storyId";
    case ContentType.THOUGHT:
      return "thoughtId";
  }
}

export async function getLikeState(target: ContentTarget, viewer: Viewer): Promise<{ count: number; likedByViewer: boolean }> {
  const field = fkField(target.contentType);
  const [count, mine] = await Promise.all([
    prisma.like.count({ where: { [field]: target.id } }),
    viewer ? prisma.like.findFirst({ where: { [field]: target.id, userId: viewer.id }, select: { id: true } }) : null,
  ]);
  return { count, likedByViewer: !!mine };
}

export async function toggleLike(
  actorId: string,
  target: ContentTarget,
  viewer: NonNullable<Viewer>,
): Promise<{ count: number; likedByViewer: boolean } | { error: string }> {
  const content = await loadTargetContent(target);
  if (!content) return { error: "This no longer exists." };

  const friendIds = await getFriendIds(viewer.id);
  if (!canView(viewer, content, friendIds)) return { error: "This no longer exists." };
  if (!content.allowLikes) return { error: "Likes are turned off for this." };

  const field = fkField(target.contentType);
  const existing = await prisma.like.findFirst({ where: { [field]: target.id, userId: actorId }, select: { id: true } });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({
      data: { userId: actorId, contentType: target.contentType, [field]: target.id },
    });
  }

  return getLikeState(target, viewer);
}
