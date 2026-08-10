import { listFeedSketchesForViewer } from "@/lib/server/sketches";
import { listFeedStoriesForViewer } from "@/lib/server/stories";
import { listFeedThoughtsForViewer } from "@/lib/server/thoughts";
import { HomeSection, HomeSectionGrid } from "@/components/home/HomeSection";
import { ContentCard } from "@/components/content/ContentCard";
import type { Viewer } from "@/lib/server/visibility";

export async function RecentFromFriendsSection({ viewer }: { viewer: NonNullable<Viewer> }) {
  const [sketches, stories, thoughts] = await Promise.all([
    listFeedSketchesForViewer(viewer, 4),
    listFeedStoriesForViewer(viewer, 4),
    listFeedThoughtsForViewer(viewer, 4),
  ]);

  const items = [...sketches, ...stories, ...thoughts]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  if (items.length === 0) return null;

  return (
    <HomeSection title="Recent from friends" subtitle="What the people you follow have been writing.">
      <HomeSectionGrid>
        {items.map((item) => (
          <ContentCard key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </HomeSectionGrid>
    </HomeSection>
  );
}
