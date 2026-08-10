import type { Metadata } from "next";
import { Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { listFeedSketchesForViewer } from "@/lib/server/sketches";
import { listFeedStoriesForViewer } from "@/lib/server/stories";
import { listFeedThoughtsForViewer } from "@/lib/server/thoughts";
import { ContentCard } from "@/components/content/ContentCard";
import { EmptyState } from "@/components/common/EmptyState";
import type { ContentSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Feed" };

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user) return null;
  const viewer = { id: session.user.id };

  const [sketches, stories, thoughts] = await Promise.all([
    listFeedSketchesForViewer(viewer, 20),
    listFeedStoriesForViewer(viewer, 20),
    listFeedThoughtsForViewer(viewer, 20),
  ]);

  const items: ContentSummary[] = [...sketches, ...stories, ...thoughts].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Feed</h1>
        <p className="text-muted-foreground">Everything your friends have shared with you.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="Nothing here yet"
          description="Add some friends, or wait for them to post something — their sketches, stories, and thoughts will show up here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <ContentCard key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
