import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Heart, MessageCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { getSketchById, getSketchAncestors, getSketchChildren } from "@/lib/server/sketches";
import { listCommentsForContent } from "@/lib/server/comments";
import { getLikeState } from "@/lib/server/likes";
import { UserAvatar } from "@/components/common/UserAvatar";
import { VisibilityBadge } from "@/components/content/VisibilityBadge";
import { Tag } from "@/components/content/Tag";
import { LikeButton } from "@/components/content/LikeButton";
import { ContinueButton } from "@/components/content/ContinueButton";
import { CommentSection } from "@/components/content/CommentSection";
import { StoryTree } from "@/components/content/StoryTree";
import { formatRelativeTime } from "@/lib/format";

async function loadSketch(id: string) {
  const session = await auth();
  const viewer = session?.user ? { id: session.user.id } : null;
  const sketch = await getSketchById(id, viewer);
  return { sketch, viewer };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { sketch } = await loadSketch(id);
  if (!sketch) return { title: "Sketch" };
  return { title: sketch.title ?? sketch.excerpt.slice(0, 60) };
}

export default async function SketchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sketch, viewer } = await loadSketch(id);
  if (!sketch) notFound();

  const [ancestors, children, commentsResult, likeState] = await Promise.all([
    getSketchAncestors(sketch, viewer),
    getSketchChildren(id, viewer),
    listCommentsForContent({ contentType: "SKETCH", id }, viewer),
    getLikeState({ contentType: "SKETCH", id }, viewer),
  ]);
  // sketch is already confirmed visible above, so comments (same visibility check) are never null here.
  const comments = commentsResult ?? [];

  const path = `/sketches/${id}`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
      {ancestors.length > 0 ? (
        <nav aria-label="Continuation chain" className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          {ancestors.map((ancestor, i) => (
            <div key={ancestor.id} className="flex items-center gap-1.5" style={{ paddingLeft: `${i * 14}px` }}>
              <span aria-hidden>↳</span>
              <Link href={`/sketches/${ancestor.id}`} className="hover:text-foreground hover:underline">
                {ancestor.title ?? ancestor.excerpt}
              </Link>
              <span className="text-xs">by {ancestor.author.displayName}</span>
            </div>
          ))}
        </nav>
      ) : null}

      <article className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserAvatar avatarUrl={sketch.author.avatarUrl} displayName={sketch.author.displayName} />
          <div className="flex flex-col leading-tight">
            <span className="font-medium text-foreground">{sketch.author.displayName}</span>
            <span>{formatRelativeTime(sketch.createdAt)}</span>
          </div>
          <VisibilityBadge visibility={sketch.visibility} className="ml-auto" />
        </div>

        {sketch.title ? <h1 className="font-serif text-2xl font-semibold sm:text-3xl">{sketch.title}</h1> : null}
        <p className="prose-content">{sketch.body}</p>

        {sketch.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {sketch.tags.map((tag) => (
              <Tag key={tag} name={tag} linked />
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {sketch.allowLikes ? (
            viewer ? (
              <LikeButton
                contentType="SKETCH"
                contentId={sketch.id}
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
          {sketch.allowContinuations && viewer ? (
            <div className="ml-auto">
              <ContinueButton parentId={sketch.id} />
            </div>
          ) : null}
        </div>
      </article>

      <StoryTree continuations={children} />

      <CommentSection
        contentType="SKETCH"
        contentId={sketch.id}
        comments={comments}
        allowComments={sketch.allowComments}
        isAuthed={!!viewer}
        path={path}
      />
    </div>
  );
}
