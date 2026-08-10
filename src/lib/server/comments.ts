import { prisma } from "@/lib/prisma";
import { ContentType } from "@prisma/client";
import type { Viewer } from "@/lib/server/visibility";
import { canView } from "@/lib/server/visibility";
import { getFriendIds } from "@/lib/server/friends";
import { AUTHOR_SELECT, toAuthorSummary } from "@/lib/server/mappers";
import { createNotification } from "@/lib/server/notifications";
import type { AuthorSummary } from "@/lib/types";

export type ContentTarget = { contentType: ContentType; id: string };

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

function targetLink(target: ContentTarget, slug?: string): string {
  switch (target.contentType) {
    case ContentType.SKETCH:
      return `/sketches/${target.id}`;
    case ContentType.STORY:
      return `/stories/${slug ?? target.id}`;
    case ContentType.THOUGHT:
      return `/feed`;
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

export type CommentNode = {
  id: string;
  body: string;
  author: AuthorSummary;
  parentId: string | null;
  createdAt: Date;
};

export async function listCommentsForContent(target: ContentTarget, viewer: Viewer): Promise<CommentNode[] | null> {
  const content = await loadTargetContent(target);
  if (!content) return null;

  const friendIds = viewer ? await getFriendIds(viewer.id) : [];
  if (!canView(viewer, content, friendIds)) return null;

  const comments = await prisma.comment.findMany({
    where: { [fkField(target.contentType)]: target.id },
    include: { author: { select: AUTHOR_SELECT } },
    orderBy: { createdAt: "asc" },
  });

  return comments.map((c) => ({
    id: c.id,
    body: c.body,
    author: toAuthorSummary(c.author),
    parentId: c.parentId,
    createdAt: c.createdAt,
  }));
}

export async function addComment(
  actorId: string,
  target: ContentTarget,
  body: string,
  viewer: NonNullable<Viewer>,
  parentId?: string,
): Promise<CommentNode | { error: string }> {
  const content = await loadTargetContent(target);
  if (!content) return { error: "This no longer exists." };

  const friendIds = await getFriendIds(viewer.id);
  if (!canView(viewer, content, friendIds)) return { error: "This no longer exists." };
  if (!content.allowComments) return { error: "Comments are turned off for this." };

  const comment = await prisma.comment.create({
    data: {
      authorId: actorId,
      contentType: target.contentType,
      parentId: parentId ?? null,
      body,
      [fkField(target.contentType)]: target.id,
    },
    include: { author: { select: AUTHOR_SELECT } },
  });

  const slug = "slug" in content ? (content.slug as string) : undefined;
  await createNotification({
    recipientId: content.authorId,
    actorId,
    type: "COMMENT",
    message: `${comment.author.profile?.displayName ?? comment.author.username} commented on your ${target.contentType.toLowerCase()}`,
    link: targetLink(target, slug),
  });

  return {
    id: comment.id,
    body: comment.body,
    author: toAuthorSummary(comment.author),
    parentId: comment.parentId,
    createdAt: comment.createdAt,
  };
}
