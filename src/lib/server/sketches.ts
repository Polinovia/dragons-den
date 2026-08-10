import { prisma } from "@/lib/prisma";
import type { Sketch } from "@prisma/client";
import type { Viewer } from "@/lib/server/visibility";
import { visibilityFilter, publicOnlyFilter, canView } from "@/lib/server/visibility";
import { getFriendIds } from "@/lib/server/friends";
import { AUTHOR_SELECT, toAuthorSummary, excerpt } from "@/lib/server/mappers";
import { createNotification } from "@/lib/server/notifications";
import type { ContentSummary } from "@/lib/types";

const CARD_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  tags: { select: { tag: { select: { name: true, slug: true } } } },
  _count: { select: { likes: true, comments: true, continuations: true } },
} as const;

type SketchWithCard = Sketch & {
  author: { id: string; username: string; profile: { displayName: string; avatarUrl: string } | null };
  tags: { tag: { name: string; slug: string } }[];
  _count: { likes: number; comments: number; continuations: number };
};

function toSummary(sketch: SketchWithCard): ContentSummary {
  return {
    kind: "SKETCH",
    id: sketch.id,
    title: sketch.title,
    excerpt: excerpt(sketch.body),
    author: toAuthorSummary(sketch.author),
    visibility: sketch.visibility,
    createdAt: sketch.createdAt,
    likeCount: sketch._count.likes,
    commentCount: sketch._count.comments,
    continuationCount: sketch._count.continuations,
    tags: sketch.tags.map((t) => t.tag.name),
  };
}

export type SketchDetail = ContentSummary & {
  body: string;
  parentId: string | null;
  allowComments: boolean;
  allowLikes: boolean;
  allowContinuations: boolean;
};

function toDetail(sketch: SketchWithCard): SketchDetail {
  return {
    ...toSummary(sketch),
    body: sketch.body,
    parentId: sketch.parentId,
    allowComments: sketch.allowComments,
    allowLikes: sketch.allowLikes,
    allowContinuations: sketch.allowContinuations,
  };
}

/** Returns null for both "doesn't exist" and "exists but not visible" — never distinguish the two. */
export async function getSketchById(id: string, viewer: Viewer): Promise<SketchDetail | null> {
  const sketch = await prisma.sketch.findUnique({ where: { id }, include: CARD_INCLUDE });
  if (!sketch) return null;

  const friendIds = viewer ? await getFriendIds(viewer.id) : [];
  if (!canView(viewer, sketch, friendIds)) return null;

  return toDetail(sketch);
}

/** Root-to-parent ancestor chain for a sketch (does not include the sketch itself). */
export async function getSketchAncestors(sketch: { parentId: string | null }, viewer: Viewer): Promise<SketchDetail[]> {
  const chain: SketchDetail[] = [];
  let currentParentId = sketch.parentId;
  const friendIds = viewer ? await getFriendIds(viewer.id) : [];

  while (currentParentId) {
    const parent = await prisma.sketch.findUnique({ where: { id: currentParentId }, include: CARD_INCLUDE });
    if (!parent || !canView(viewer, parent, friendIds)) break;
    chain.unshift(toDetail(parent));
    currentParentId = parent.parentId;
  }

  return chain;
}

/** Immediate continuations, filtered to what the viewer can see. */
export async function getSketchChildren(id: string, viewer: Viewer): Promise<SketchDetail[]> {
  const friendIds = viewer ? await getFriendIds(viewer.id) : [];
  const children = await prisma.sketch.findMany({
    where: { parentId: id, ...visibilityFilter(viewer, friendIds) },
    include: CARD_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  return children.map(toDetail);
}

export async function listExplorePublicSketches(params: {
  search?: string;
  tagSlug?: string;
  take?: number;
}): Promise<ContentSummary[]> {
  const { search, tagSlug, take = 24 } = params;

  const sketches = await prisma.sketch.findMany({
    where: {
      ...publicOnlyFilter(),
      ...(search
        ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { body: { contains: search, mode: "insensitive" } }] }
        : {}),
      ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
    },
    include: CARD_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });

  return sketches.map(toSummary);
}

export async function listFeedSketchesForViewer(viewer: NonNullable<Viewer>, take = 12): Promise<ContentSummary[]> {
  const friendIds = await getFriendIds(viewer.id);
  if (friendIds.length === 0) return [];

  const sketches = await prisma.sketch.findMany({
    where: {
      authorId: { in: friendIds },
      OR: [{ visibility: "PUBLIC" }, { visibility: "FRIENDS" }],
    },
    include: CARD_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });

  return sketches.map(toSummary);
}

export async function listSketchesByAuthorForViewer(
  authorId: string,
  viewer: Viewer,
  take = 30,
): Promise<ContentSummary[]> {
  const friendIds = viewer ? await getFriendIds(viewer.id) : [];
  const sketches = await prisma.sketch.findMany({
    where: { authorId, ...visibilityFilter(viewer, friendIds) },
    include: CARD_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
  return sketches.map(toSummary);
}

/** Sketches open for continuation that the viewer can see and didn't write themselves. */
export async function listSketchesOpenForContinuation(viewer: NonNullable<Viewer>, take = 6): Promise<ContentSummary[]> {
  const friendIds = await getFriendIds(viewer.id);
  const sketches = await prisma.sketch.findMany({
    where: {
      allowContinuations: true,
      authorId: { not: viewer.id },
      ...visibilityFilter(viewer, friendIds),
    },
    include: CARD_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
  return sketches.map(toSummary);
}

export async function listRecentSketchesForViewer(viewer: Viewer, take = 6): Promise<ContentSummary[]> {
  const friendIds = viewer ? await getFriendIds(viewer.id) : [];
  const sketches = await prisma.sketch.findMany({
    where: visibilityFilter(viewer, friendIds),
    include: CARD_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
  return sketches.map(toSummary);
}

export async function createSketch(
  authorId: string,
  data: { title?: string | null; body: string; visibility: "PRIVATE" | "FRIENDS" | "PUBLIC" },
) {
  return prisma.sketch.create({
    data: {
      authorId,
      title: data.title ?? null,
      body: data.body,
      visibility: data.visibility,
    },
  });
}

export async function createSketchContinuation(
  parentId: string,
  authorId: string,
  data: { title?: string | null; body: string; visibility: "PRIVATE" | "FRIENDS" | "PUBLIC" },
  viewer: NonNullable<Viewer>,
): Promise<SketchDetail | { error: string }> {
  const parent = await prisma.sketch.findUnique({ where: { id: parentId } });
  if (!parent) return { error: "This sketch no longer exists." };

  const friendIds = await getFriendIds(viewer.id);
  if (!canView(viewer, parent, friendIds)) return { error: "This sketch no longer exists." };
  if (!parent.allowContinuations) return { error: "The author has turned off continuations for this sketch." };

  const child = await prisma.sketch.create({
    data: {
      authorId,
      parentId,
      title: data.title ?? null,
      body: data.body,
      visibility: data.visibility,
    },
    include: CARD_INCLUDE,
  });

  await createNotification({
    recipientId: parent.authorId,
    actorId: authorId,
    type: "CONTINUATION",
    message: `${child.author.profile?.displayName ?? child.author.username} continued your sketch`,
    link: `/sketches/${child.id}`,
  });

  return toDetail(child);
}
