import { prisma } from "@/lib/prisma";
import type { Story, StoryStatus } from "@prisma/client";
import type { Viewer } from "@/lib/server/visibility";
import { visibilityFilter, publicOnlyFilter, canView } from "@/lib/server/visibility";
import { getFriendIds } from "@/lib/server/friends";
import { AUTHOR_SELECT, toAuthorSummary, excerpt } from "@/lib/server/mappers";
import { createNotification } from "@/lib/server/notifications";
import { slugify } from "@/lib/slug";
import type { ContentSummary } from "@/lib/types";

const CARD_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  tags: { select: { tag: { select: { name: true, slug: true } } } },
  _count: { select: { likes: true, comments: true, chapters: true } },
} as const;

type StoryWithCard = Story & {
  author: { id: string; username: string; profile: { displayName: string; avatarUrl: string } | null };
  tags: { tag: { name: string; slug: string } }[];
  _count: { likes: number; comments: number; chapters: number };
};

function toSummary(story: StoryWithCard): ContentSummary {
  return {
    kind: "STORY",
    id: story.id,
    slug: story.slug,
    title: story.title,
    excerpt: story.synopsis ? excerpt(story.synopsis) : `${story._count.chapters} chapter${story._count.chapters === 1 ? "" : "s"}`,
    author: toAuthorSummary(story.author),
    visibility: story.visibility,
    createdAt: story.createdAt,
    likeCount: story._count.likes,
    commentCount: story._count.comments,
    tags: story.tags.map((t) => t.tag.name),
    status: story.status,
  };
}

async function uniqueStorySlug(title: string): Promise<string> {
  const base = slugify(title) || "story";
  let candidate = base;
  let attempt = 1;
  while (await prisma.story.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
  return candidate;
}

export async function getStoryBySlug(slug: string, viewer: Viewer) {
  const story = await prisma.story.findUnique({
    where: { slug },
    include: {
      ...CARD_INCLUDE,
      contributors: {
        include: { user: { select: AUTHOR_SELECT } },
      },
      chapters: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
        select: { id: true, slug: true, title: true, order: true, createdAt: true },
      },
    },
  });
  if (!story) return null;

  const friendIds = viewer ? await getFriendIds(viewer.id) : [];
  if (!canView(viewer, story, friendIds)) return null;

  return {
    ...toSummary(story),
    synopsis: story.synopsis,
    allowComments: story.allowComments,
    allowLikes: story.allowLikes,
    allowContributions: story.allowContributions,
    contributors: story.contributors.map((c) => ({ ...toAuthorSummary(c.user), role: c.role })),
    chapters: story.chapters,
  };
}

export type StoryDetail = NonNullable<Awaited<ReturnType<typeof getStoryBySlug>>>;

export async function listExplorePublicStories(params: { search?: string; tagSlug?: string; take?: number }) {
  const { search, tagSlug, take = 24 } = params;

  const stories = await prisma.story.findMany({
    where: {
      ...publicOnlyFilter(),
      ...(search
        ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { synopsis: { contains: search, mode: "insensitive" } }] }
        : {}),
      ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
    },
    include: CARD_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });

  return stories.map(toSummary);
}

export async function listRecentStoriesForViewer(viewer: Viewer, take = 6): Promise<ContentSummary[]> {
  const friendIds = viewer ? await getFriendIds(viewer.id) : [];
  const stories = await prisma.story.findMany({
    where: visibilityFilter(viewer, friendIds),
    include: CARD_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
  return stories.map(toSummary);
}

export async function listFeedStoriesForViewer(viewer: NonNullable<Viewer>, take = 12): Promise<ContentSummary[]> {
  const friendIds = await getFriendIds(viewer.id);
  if (friendIds.length === 0) return [];

  const stories = await prisma.story.findMany({
    where: {
      authorId: { in: friendIds },
      OR: [{ visibility: "PUBLIC" }, { visibility: "FRIENDS" }],
    },
    include: CARD_INCLUDE,
    orderBy: { updatedAt: "desc" },
    take,
  });

  return stories.map(toSummary);
}

export async function listStoriesForAuthorOrContributor(
  userId: string,
  viewer: Viewer,
  take = 30,
): Promise<ContentSummary[]> {
  const friendIds = viewer ? await getFriendIds(viewer.id) : [];
  const stories = await prisma.story.findMany({
    where: {
      OR: [{ authorId: userId }, { contributors: { some: { userId } } }],
      ...visibilityFilter(viewer, friendIds),
    },
    include: CARD_INCLUDE,
    orderBy: { updatedAt: "desc" },
    take,
  });
  return stories.map(toSummary);
}

export async function listDraftStoriesForViewer(viewer: NonNullable<Viewer>, take = 10): Promise<ContentSummary[]> {
  const stories = await prisma.story.findMany({
    where: { authorId: viewer.id, status: "DRAFT" },
    include: CARD_INCLUDE,
    orderBy: { updatedAt: "desc" },
    take,
  });
  return stories.map(toSummary);
}

export async function listSuggestedStories(viewer: Viewer, take = 6): Promise<ContentSummary[]> {
  const stories = await prisma.story.findMany({
    where: {
      visibility: "PUBLIC",
      status: { in: ["ONGOING", "COMPLETED"] },
      ...(viewer ? { authorId: { not: viewer.id } } : {}),
    },
    include: CARD_INCLUDE,
    orderBy: { updatedAt: "desc" },
    take,
  });
  return stories.map(toSummary);
}

export async function createStory(
  authorId: string,
  data: {
    title: string;
    synopsis?: string | null;
    status?: StoryStatus;
    visibility: "PRIVATE" | "FRIENDS" | "PUBLIC";
    allowContributions?: boolean;
  },
) {
  const slug = await uniqueStorySlug(data.title);
  const story = await prisma.story.create({
    data: {
      authorId,
      title: data.title,
      slug,
      synopsis: data.synopsis ?? null,
      status: data.status ?? "DRAFT",
      visibility: data.visibility,
      allowContributions: data.allowContributions ?? false,
    },
  });
  await prisma.storyContributor.create({
    data: { storyId: story.id, userId: authorId, role: "OWNER" },
  });
  return story;
}

export async function addStoryContributor(
  storySlug: string,
  requestedByUserId: string,
  targetUsername: string,
): Promise<{ error: string } | { ok: true }> {
  const story = await prisma.story.findUnique({ where: { slug: storySlug } });
  if (!story) return { error: "This story no longer exists." };
  if (story.authorId !== requestedByUserId) return { error: "Only the story owner can add contributors." };
  if (!story.allowContributions) return { error: "This story isn't open to contributors." };

  const target = await prisma.user.findUnique({ where: { username: targetUsername }, select: { id: true } });
  if (!target) return { error: "No user with that username." };

  await prisma.storyContributor.upsert({
    where: { storyId_userId: { storyId: story.id, userId: target.id } },
    update: {},
    create: { storyId: story.id, userId: target.id, role: "CONTRIBUTOR" },
  });

  await createNotification({
    recipientId: target.id,
    actorId: requestedByUserId,
    type: "CONTRIBUTOR_ADDED",
    message: `You were added as a contributor to "${story.title}"`,
    link: `/stories/${story.slug}`,
  });

  return { ok: true };
}
