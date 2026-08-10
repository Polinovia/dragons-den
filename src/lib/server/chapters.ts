import { prisma } from "@/lib/prisma";
import type { Viewer } from "@/lib/server/visibility";
import { canView } from "@/lib/server/visibility";
import { getFriendIds } from "@/lib/server/friends";
import { AUTHOR_SELECT, toAuthorSummary } from "@/lib/server/mappers";
import { slugify } from "@/lib/slug";

/**
 * Re-derives the parent Story's visibility on every call — a Chapter has no
 * visibility of its own, and a client-supplied storySlug is never trusted as pre-authorized.
 */
export async function getChapterBySlug(storySlug: string, chapterSlug: string, viewer: Viewer) {
  const story = await prisma.story.findUnique({
    where: { slug: storySlug },
    include: {
      chapters: { where: { isPublished: true }, orderBy: { order: "asc" } },
    },
  });
  if (!story) return null;

  const friendIds = viewer ? await getFriendIds(viewer.id) : [];
  if (!canView(viewer, story, friendIds)) return null;

  const index = story.chapters.findIndex((c) => c.slug === chapterSlug);
  if (index === -1) return null;

  const chapter = story.chapters[index];
  const author = await prisma.user.findUnique({ where: { id: chapter.authorId }, select: AUTHOR_SELECT });

  return {
    story: { id: story.id, slug: story.slug, title: story.title },
    chapter: {
      id: chapter.id,
      slug: chapter.slug,
      title: chapter.title,
      body: chapter.body,
      order: chapter.order,
      createdAt: chapter.createdAt,
      author: author ? toAuthorSummary(author) : null,
    },
    prevChapter: index > 0 ? { slug: story.chapters[index - 1].slug, title: story.chapters[index - 1].title } : null,
    nextChapter:
      index < story.chapters.length - 1
        ? { slug: story.chapters[index + 1].slug, title: story.chapters[index + 1].title }
        : null,
  };
}

async function uniqueChapterSlug(storyId: string, title: string): Promise<string> {
  const base = slugify(title) || "chapter";
  let candidate = base;
  let attempt = 1;
  while (
    await prisma.chapter.findUnique({ where: { storyId_slug: { storyId, slug: candidate } }, select: { id: true } })
  ) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
  return candidate;
}

export async function createChapter(
  storySlug: string,
  authorId: string,
  data: { title: string; body: string },
): Promise<{ error: string } | { ok: true; slug: string }> {
  const story = await prisma.story.findUnique({
    where: { slug: storySlug },
    include: { contributors: { select: { userId: true } } },
  });
  if (!story) return { error: "This story no longer exists." };

  const isOwnerOrContributor = story.contributors.some((c) => c.userId === authorId);
  if (!isOwnerOrContributor) return { error: "You aren't a contributor on this story." };

  const maxOrder = await prisma.chapter.aggregate({ where: { storyId: story.id }, _max: { order: true } });
  const nextOrder = (maxOrder._max.order ?? 0) + 1;
  const slug = await uniqueChapterSlug(story.id, data.title);

  await prisma.chapter.create({
    data: {
      storyId: story.id,
      authorId,
      title: data.title,
      slug,
      body: data.body,
      order: nextOrder,
    },
  });

  return { ok: true, slug };
}
