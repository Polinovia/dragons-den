import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Heart, MessageCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { getStoryBySlug } from "@/lib/server/stories";
import { listCommentsForContent } from "@/lib/server/comments";
import { getLikeState } from "@/lib/server/likes";
import { UserAvatar } from "@/components/common/UserAvatar";
import { VisibilityBadge } from "@/components/content/VisibilityBadge";
import { Tag } from "@/components/content/Tag";
import { LikeButton } from "@/components/content/LikeButton";
import { CommentSection } from "@/components/content/CommentSection";
import { AddContributorForm } from "@/components/forms/AddContributorForm";
import { formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

async function loadStory(slug: string) {
  const session = await auth();
  const viewer = session?.user ? { id: session.user.id } : null;
  const story = await getStoryBySlug(slug, viewer);
  return { story, viewer };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { story } = await loadStory(slug);
  return { title: story?.title ?? "Story" };
}

export default async function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { story, viewer } = await loadStory(slug);
  if (!story) notFound();

  const [commentsResult, likeState] = await Promise.all([
    listCommentsForContent({ contentType: "STORY", id: story.id }, viewer),
    getLikeState({ contentType: "STORY", id: story.id }, viewer),
  ]);
  const comments = commentsResult ?? [];
  const path = `/stories/${slug}`;
  const isOwner = viewer?.id === story.author.id;
  const otherContributors = story.contributors.filter((c) => c.id !== story.author.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
      <article className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/profile/${story.author.username}`} className="flex items-center gap-2 hover:underline">
            <UserAvatar avatarUrl={story.author.avatarUrl} displayName={story.author.displayName} />
            <div className="flex flex-col leading-tight">
              <span className="font-medium text-foreground">{story.author.displayName}</span>
              <span>{formatRelativeTime(story.createdAt)}</span>
            </div>
          </Link>
          <VisibilityBadge visibility={story.visibility} className="ml-auto" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-serif text-2xl font-semibold sm:text-3xl">{story.title}</h1>
          <Badge variant="secondary" className="capitalize">
            {(story.status ?? "draft").toLowerCase()}
          </Badge>
        </div>

        {story.synopsis ? <p className="text-muted-foreground">{story.synopsis}</p> : null}

        {otherContributors.length > 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>With</span>
            <div className="flex -space-x-2">
              {otherContributors.map((c) => (
                <Link key={c.id} href={`/profile/${c.username}`}>
                  <UserAvatar
                    avatarUrl={c.avatarUrl}
                    displayName={c.displayName}
                    size="sm"
                    className="ring-2 ring-background"
                  />
                </Link>
              ))}
            </div>
            <span>{otherContributors.map((c) => c.displayName).join(", ")}</span>
          </div>
        ) : null}

        {story.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {story.tags.map((tag) => (
              <Tag key={tag} name={tag} linked />
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {story.allowLikes ? (
            viewer ? (
              <LikeButton
                contentType="STORY"
                contentId={story.id}
                initialCount={likeState.count}
                initialLiked={likeState.likedByViewer}
                path={path}
              />
            ) : (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Heart className="size-4" /> {likeState.count}
              </span>
            )
          ) : null}
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageCircle className="size-4" /> {comments.length}
          </span>
        </div>
      </article>

      <div className="flex flex-col gap-3">
        <h2 className="font-serif text-lg font-semibold">
          {story.chapters.length} chapter{story.chapters.length === 1 ? "" : "s"}
        </h2>
        {story.chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground">No chapters published yet.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {story.chapters.map((chapter, i) => (
              <li key={chapter.id}>
                <Link
                  href={`/stories/${slug}/chapters/${chapter.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="font-medium">{chapter.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>

      {isOwner && story.allowContributions ? <AddContributorForm storySlug={slug} /> : null}

      <CommentSection
        contentType="STORY"
        contentId={story.id}
        comments={comments}
        allowComments={story.allowComments}
        isAuthed={!!viewer}
        path={path}
      />
    </div>
  );
}
