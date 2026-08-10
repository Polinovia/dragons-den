"use client";

import { useActionState } from "react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import { addCommentAction, type CommentActionState } from "@/actions/comment";
import type { ContentType } from "@prisma/client";
import type { CommentNode } from "@/lib/server/comments";

const initialState: CommentActionState = {};

export function CommentSection({
  contentType,
  contentId,
  comments,
  allowComments,
  isAuthed,
  path,
}: {
  contentType: ContentType;
  contentId: string;
  comments: CommentNode[];
  allowComments: boolean;
  isAuthed: boolean;
  path: string;
}) {
  const [state, formAction, isPending] = useActionState(addCommentAction, initialState);
  const topLevel = comments.filter((c) => !c.parentId);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-serif text-lg font-semibold">
        {comments.length} comment{comments.length === 1 ? "" : "s"}
      </h2>

      {allowComments && isAuthed ? (
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="contentType" value={contentType} />
          <input type="hidden" name="contentId" value={contentId} />
          <input type="hidden" name="path" value={path} />
          <Textarea name="body" placeholder="Add a comment…" required maxLength={2000} rows={3} />
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" size="sm" disabled={isPending} className="self-end">
            {isPending ? "Posting…" : "Post comment"}
          </Button>
        </form>
      ) : !allowComments ? (
        <p className="text-sm text-muted-foreground">Comments are turned off for this.</p>
      ) : null}

      {topLevel.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {topLevel.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <UserAvatar avatarUrl={comment.author.avatarUrl} displayName={comment.author.displayName} size="sm" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{comment.author.displayName}</span>
                  <span className="text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="text-sm whitespace-pre-line">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
