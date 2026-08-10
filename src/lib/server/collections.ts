import { prisma } from "@/lib/prisma";
import { Visibility } from "@prisma/client";
import type { Viewer } from "@/lib/server/visibility";
import { publicOnlyFilter, canView } from "@/lib/server/visibility";
import { getFriendIds } from "@/lib/server/friends";
import { AUTHOR_SELECT, toAuthorSummary, excerpt } from "@/lib/server/mappers";

/** Same idea as visibilityFilter, but Collection uses `ownerId` instead of `authorId`. */
function collectionVisibilityFilter(viewer: Viewer, friendIds: string[]) {
  if (!viewer) return { visibility: Visibility.PUBLIC };
  return {
    OR: [
      { visibility: Visibility.PUBLIC },
      { ownerId: viewer.id },
      { visibility: Visibility.FRIENDS, ownerId: { in: friendIds } },
    ],
  };
}

const SKETCH_SELECT = {
  id: true,
  title: true,
  body: true,
  authorId: true,
  visibility: true,
  author: { select: AUTHOR_SELECT },
} as const;

const STORY_SELECT = {
  id: true,
  slug: true,
  title: true,
  synopsis: true,
  authorId: true,
  visibility: true,
  author: { select: AUTHOR_SELECT },
} as const;

const THOUGHT_SELECT = {
  id: true,
  body: true,
  authorId: true,
  visibility: true,
  author: { select: AUTHOR_SELECT },
} as const;

export async function getCollectionById(id: string, viewer: Viewer) {
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      owner: { select: AUTHOR_SELECT },
      contributors: { include: { user: { select: AUTHOR_SELECT } } },
      items: {
        orderBy: { order: "asc" },
        include: {
          sketch: { select: SKETCH_SELECT },
          story: { select: STORY_SELECT },
          thought: { select: THOUGHT_SELECT },
          addedBy: { select: AUTHOR_SELECT },
        },
      },
    },
  });
  if (!collection) return null;

  const friendIds = viewer ? await getFriendIds(viewer.id) : [];
  if (!canView(viewer, { authorId: collection.ownerId, visibility: collection.visibility }, friendIds)) {
    return null;
  }

  const items = collection.items
    .filter((item) => {
      if (item.itemType === "NOTE") return true;
      const linked = item.sketch ?? item.story ?? item.thought;
      if (!linked) return false;
      return canView(viewer, linked, friendIds);
    })
    .map((item) => {
      if (item.itemType === "NOTE") {
        return {
          id: item.id,
          itemType: item.itemType,
          title: item.noteTitle,
          excerpt: item.noteBody ? excerpt(item.noteBody) : "",
          href: null,
        };
      }
      if (item.itemType === "SKETCH" && item.sketch) {
        return {
          id: item.id,
          itemType: item.itemType,
          title: item.sketch.title,
          excerpt: excerpt(item.sketch.body),
          href: `/sketches/${item.sketch.id}`,
        };
      }
      if (item.itemType === "STORY" && item.story) {
        return {
          id: item.id,
          itemType: item.itemType,
          title: item.story.title,
          excerpt: item.story.synopsis ? excerpt(item.story.synopsis) : "",
          href: `/stories/${item.story.slug}`,
        };
      }
      if (item.itemType === "THOUGHT" && item.thought) {
        return {
          id: item.id,
          itemType: item.itemType,
          title: null,
          excerpt: excerpt(item.thought.body),
          href: null,
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    visibility: collection.visibility,
    owner: toAuthorSummary(collection.owner),
    contributors: collection.contributors.map((c) => toAuthorSummary(c.user)),
    createdAt: collection.createdAt,
    items,
  };
}

export type CollectionDetail = NonNullable<Awaited<ReturnType<typeof getCollectionById>>>;

export async function listCollectionsForOwnerOrContributor(userId: string, viewer: Viewer, take = 20) {
  const friendIds = viewer ? await getFriendIds(viewer.id) : [];
  const collections = await prisma.collection.findMany({
    where: {
      AND: [
        { OR: [{ ownerId: userId }, { contributors: { some: { userId } } }] },
        collectionVisibilityFilter(viewer, friendIds),
      ],
    },
    include: { owner: { select: AUTHOR_SELECT }, _count: { select: { items: true } } },
    orderBy: { updatedAt: "desc" },
    take,
  });

  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    visibility: c.visibility,
    owner: toAuthorSummary(c.owner),
    itemCount: c._count.items,
    createdAt: c.createdAt,
  }));
}

export async function listExplorePublicCollections(params: { search?: string; take?: number }) {
  const { search, take = 24 } = params;
  const collections = await prisma.collection.findMany({
    where: {
      ...publicOnlyFilter(),
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    },
    include: { owner: { select: AUTHOR_SELECT }, _count: { select: { items: true } } },
    orderBy: { updatedAt: "desc" },
    take,
  });

  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    visibility: c.visibility,
    owner: toAuthorSummary(c.owner),
    itemCount: c._count.items,
    createdAt: c.createdAt,
  }));
}

export async function createCollection(
  ownerId: string,
  data: { name: string; description?: string | null; visibility: "PRIVATE" | "FRIENDS" | "PUBLIC" },
) {
  return prisma.collection.create({
    data: {
      ownerId,
      name: data.name,
      description: data.description ?? null,
      visibility: data.visibility,
    },
  });
}
