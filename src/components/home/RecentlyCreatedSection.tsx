import { listRecentSketchesForViewer } from "@/lib/server/sketches";
import { listRecentStoriesForViewer } from "@/lib/server/stories";
import { listRecentThoughtsForViewer } from "@/lib/server/thoughts";
import { HomeSection, HomeSectionGrid } from "@/components/home/HomeSection";
import { ContentCard } from "@/components/content/ContentCard";
import type { Viewer } from "@/lib/server/visibility";

export async function RecentlyCreatedSection({ viewer }: { viewer: NonNullable<Viewer> }) {
  const [sketches, stories, thoughts] = await Promise.all([
    listRecentSketchesForViewer(viewer, 4),
    listRecentStoriesForViewer(viewer, 4),
    listRecentThoughtsForViewer(viewer, 4),
  ]);

  const items = [...sketches, ...stories, ...thoughts]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  if (items.length === 0) return null;

  return (
    <HomeSection title="Recently created" subtitle="Fresh sketches, stories, and thoughts across the space.">
      <HomeSectionGrid>
        {items.map((item) => (
          <ContentCard key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </HomeSectionGrid>
    </HomeSection>
  );
}
