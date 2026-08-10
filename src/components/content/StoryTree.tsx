import Link from "next/link";
import { UserAvatar } from "@/components/common/UserAvatar";
import type { SketchDetail } from "@/lib/server/sketches";

export function StoryTree({ continuations }: { continuations: SketchDetail[] }) {
  if (continuations.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-serif text-lg font-semibold">
        {continuations.length} continuation{continuations.length === 1 ? "" : "s"}
      </h2>
      <ul className="flex flex-col gap-3">
        {continuations.map((child) => (
          <li key={child.id}>
            <Link
              href={`/sketches/${child.id}`}
              className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                <UserAvatar avatarUrl={child.author.avatarUrl} displayName={child.author.displayName} size="sm" />
                <span className="font-medium text-foreground">{child.author.displayName}</span>
              </div>
              <p className="prose-content line-clamp-2 text-sm">{child.body}</p>
              {child.continuationCount ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {child.continuationCount} further continuation{child.continuationCount === 1 ? "" : "s"}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
