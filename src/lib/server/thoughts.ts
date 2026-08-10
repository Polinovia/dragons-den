import { prisma } from "@/lib/prisma";
import type { Thought } from "@prisma/client";
import type { Viewer } from "@/lib/server/visibility";
import { visibilityFilter, canView } from "@/lib/server/visibility";
import { getFriendIds } from "@/lib/server/friends";
import { AUTHOR_SELECT, toAuthorSummary, excerpt } from "@/lib/server/mappers";
import type { ContentSummary } from "@/lib/types";

const CARD_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  tags: { select: { tag: { select: { name: true, slug: true } } } },
  _count: { select: { likes: true, comments: true } },
} as const;

type ThoughtWithCard = Thought & {
  author: { id: string; username: string; profile: { displayName: string; avatarUrl: string } | null };
  tags: { tag: { name: string; slug: string } }[];
  _count: { likes: number; comments: number };
};

function toSummary(thought: ThoughtWithCard): ContentSummary {
  return {
    kind: "THOUGHT",
    id: thought.id,
    title: null,
    excerpt: excerpt(thought.body, 280),
    author: toAuthorSummary(thought.author),
    visibility: thought.visibility,
    createdAt: thought.createdAt,
    likeCount: thought._count.likes,
    commentCount: thought._count.comments,
    tags: thought.tags.map((t) => t.tag.name),
  };
}

export type ThoughtDetail = ContentSummary & {
  body: string;
  allowComments: boolean;
  allowLikes: boolean;
};

function toDetail(thought: ThoughtWithCard): ThoughtDetail {
  return {
    ...toSummary(thought),
    body: thought.body,
    allowComments: thought.allowComments,
    allowLikes: thought.allowLikes,
  };
}

export async function getThoughtById(id: string, viewer: Viewer): Promise<ThoughtDetail | null> {
  const thought = await prisma.thought.findUnique({ where: { id }, include: CARD_INCLUDE });
  if (!thought) return null;

  const friendIds = viewer ? await getFriendIds(viewer.id) : [];
  if (!canView(viewer, thought, friendIds)) return null;

  return toDetail(thought);
}

export async function listExplorePublicThoughts(params: {
  search?: string;
  tagSlug?: string;
  take?: number;
}): Promise<ContentSummary[]> {
  const { search, tagSlug, take = 24 } = params;
  const thoughts = await prisma.thought.findMany({
    where: {
      visibility: "PUBLIC",
      ...(search ? { body: { contains: search, mode: "insensitive" } } : {}),
      ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
    },
    include: CARD_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
  return thoughts.map(toSummary);
}

export async function listRecentThoughtsForViewer(viewer: Viewer, take = 6): Promise<ContentSummary[]> {
  const friendIds = viewer ? await getFriendIds(viewer.id) : [];
  const thoughts = await prisma.thought.findMany({
    where: visibilityFilter(viewer, friendIds),
    include: CARD_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
  return thoughts.map(toSummary);
}

export async function listFeedThoughtsForViewer(viewer: NonNullable<Viewer>, take = 12): Promise<ContentSummary[]> {
  const friendIds = await getFriendIds(viewer.id);
  if (friendIds.length === 0) return [];

  const thoughts = await prisma.thought.findMany({
    where: {
      authorId: { in: friendIds },
      OR: [{ visibility: "PUBLIC" }, { visibility: "FRIENDS" }],
    },
    include: CARD_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
  return thoughts.map(toSummary);
}

export async function listThoughtsByAuthorForViewer(authorId: string, viewer: Viewer, take = 30): Promise<ContentSummary[]> {
  const friendIds = viewer ? await getFriendIds(viewer.id) : [];
  const thoughts = await prisma.thought.findMany({
    where: { authorId, ...visibilityFilter(viewer, friendIds) },
    include: CARD_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
  return thoughts.map(toSummary);
}

export async function createThought(
  authorId: string,
  data: { body: string; visibility: "PRIVATE" | "FRIENDS" | "PUBLIC" },
) {
  return prisma.thought.create({
    data: { authorId, body: data.body, visibility: data.visibility },
  });
}
