import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { getChapterBySlug } from "@/lib/server/chapters";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";

async function loadChapter(storySlug: string, chapterSlug: string) {
  const session = await auth();
  const viewer = session?.user ? { id: session.user.id } : null;
  return getChapterBySlug(storySlug, chapterSlug, viewer);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; chapterSlug: string }>;
}): Promise<Metadata> {
  const { slug, chapterSlug } = await params;
  const data = await loadChapter(slug, chapterSlug);
  return { title: data ? `${data.chapter.title} · ${data.story.title}` : "Chapter" };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapterSlug: string }>;
}) {
  const { slug, chapterSlug } = await params;
  const data = await loadChapter(slug, chapterSlug);
  if (!data) notFound();

  const { story, chapter, prevChapter, nextChapter } = data;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Link
        href={`/stories/${slug}`}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-3.5" /> {story.title}
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-2xl font-semibold sm:text-3xl">{chapter.title}</h1>
        {chapter.author ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href={`/profile/${chapter.author.username}`}
              className="flex items-center gap-2 hover:underline"
            >
              <UserAvatar avatarUrl={chapter.author.avatarUrl} displayName={chapter.author.displayName} size="sm" />
              <span>{chapter.author.displayName}</span>
            </Link>
            <span>· {formatRelativeTime(chapter.createdAt)}</span>
          </div>
        ) : null}
      </div>

      <p className="prose-content">{chapter.body}</p>

      <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
        {prevChapter ? (
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/stories/${slug}/chapters/${prevChapter.slug}`} />}
            nativeButton={false}
            className="max-w-[45%]"
          >
            <ChevronLeft className="size-4 shrink-0" /> <span className="truncate">{prevChapter.title}</span>
          </Button>
        ) : (
          <span />
        )}
        {nextChapter ? (
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/stories/${slug}/chapters/${nextChapter.slug}`} />}
            nativeButton={false}
            className="max-w-[45%]"
          >
            <span className="truncate">{nextChapter.title}</span> <ChevronRight className="size-4 shrink-0" />
          </Button>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
