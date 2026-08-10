import { Suspense } from "react";
import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { listExplorePublicSketches } from "@/lib/server/sketches";
import { listExplorePublicStories } from "@/lib/server/stories";
import { listExplorePublicThoughts } from "@/lib/server/thoughts";
import { listExplorePublicCollections } from "@/lib/server/collections";
import { ContentCard } from "@/components/content/ContentCard";
import { CollectionCard } from "@/components/content/CollectionCard";
import { ExploreFilters } from "@/components/explore/ExploreFilters";
import { EmptyState } from "@/components/common/EmptyState";
import type { ContentSummary } from "@/lib/types";

export const metadata: Metadata = { title: "Explore" };

type ExploreSearchParams = {
  q?: string;
  type?: string;
  tag?: string;
  sort?: string;
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<ExploreSearchParams>;
}) {
  const { q, type = "all", tag, sort = "recent" } = await searchParams;
  const search = q?.trim() || undefined;

  const wantsSketches = type === "all" || type === "sketch";
  const wantsStories = type === "all" || type === "story";
  const wantsThoughts = type === "all" || type === "thought";
  const wantsCollections = type === "all" || type === "collection";

  const [sketches, stories, thoughts, collections] = await Promise.all([
    wantsSketches ? listExplorePublicSketches({ search, tagSlug: tag, take: 24 }) : Promise.resolve([]),
    wantsStories ? listExplorePublicStories({ search, tagSlug: tag, take: 24 }) : Promise.resolve([]),
    wantsThoughts ? listExplorePublicThoughts({ search, tagSlug: tag, take: 24 }) : Promise.resolve([]),
    wantsCollections ? listExplorePublicCollections({ search, take: 24 }) : Promise.resolve([]),
  ]);

  const items: ContentSummary[] = [...sketches, ...stories, ...thoughts].sort((a, b) =>
    sort === "popular"
      ? b.likeCount + b.commentCount - (a.likeCount + a.commentCount)
      : b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const hasResults = items.length > 0 || collections.length > 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Explore</h1>
        <p className="text-muted-foreground">Public sketches, stories, thoughts, and worlds from the whole space.</p>
      </div>

      <Suspense>
        <ExploreFilters tagLabel={tag} />
      </Suspense>

      {!hasResults ? (
        <EmptyState
          icon={<Compass className="size-6" />}
          title="Nothing here yet"
          description={search ? `No public content matches "${search}".` : "No public content matches these filters."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ContentCard key={`${item.kind}-${item.id}`} item={item} />
          ))}
          {wantsCollections ? collections.map((c) => <CollectionCard key={`collection-${c.id}`} collection={c} />) : null}
        </div>
      )}
    </div>
  );
}
