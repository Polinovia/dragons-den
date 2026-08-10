import Link from "next/link";
import { Heart, MessageCircle, GitBranch, BookOpen, PenLine, Feather } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserAvatar } from "@/components/common/UserAvatar";
import { VisibilityBadge } from "@/components/content/VisibilityBadge";
import { Tag } from "@/components/content/Tag";
import { formatRelativeTime } from "@/lib/format";
import type { ContentSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_LABEL = { SKETCH: "Sketch", STORY: "Story", THOUGHT: "Thought" } as const;
const KIND_ICON = { SKETCH: PenLine, STORY: BookOpen, THOUGHT: Feather } as const;

function hrefFor(item: ContentSummary): string | null {
  switch (item.kind) {
    case "SKETCH":
      return `/sketches/${item.id}`;
    case "STORY":
      return `/stories/${item.slug}`;
    case "THOUGHT":
      return null;
  }
}

export function ContentCard({ item, className }: { item: ContentSummary; className?: string }) {
  const href = hrefFor(item);
  const KindIcon = KIND_ICON[item.kind];

  const body = (
    <Card className={cn("h-full", href && "transition-shadow hover:shadow-md hover:ring-foreground/20", className)}>
      <CardHeader>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserAvatar avatarUrl={item.author.avatarUrl} displayName={item.author.displayName} size="sm" />
          <span className="font-medium text-foreground">{item.author.displayName}</span>
          <span aria-hidden>·</span>
          <span>{formatRelativeTime(item.createdAt)}</span>
          <VisibilityBadge visibility={item.visibility} className="ml-auto" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <KindIcon className="size-3.5" />
          {KIND_LABEL[item.kind]}
          {item.status ? <span className="normal-case">· {item.status.toLowerCase()}</span> : null}
        </div>
        {item.title ? <h3 className="font-serif text-lg leading-snug font-semibold">{item.title}</h3> : null}
        <p className="line-clamp-3 text-sm text-muted-foreground">{item.excerpt}</p>
        {item.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {item.tags.slice(0, 4).map((tag) => (
              <Tag key={tag} name={tag} />
            ))}
          </div>
        ) : null}
        <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="size-3.5" /> {item.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="size-3.5" /> {item.commentCount}
          </span>
          {typeof item.continuationCount === "number" && item.continuationCount > 0 ? (
            <span className="flex items-center gap-1">
              <GitBranch className="size-3.5" /> {item.continuationCount}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  if (!href) return body;

  return (
    <Link href={href} className="block h-full rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {body}
    </Link>
  );
}
