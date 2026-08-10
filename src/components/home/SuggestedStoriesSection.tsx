import { listSuggestedStories } from "@/lib/server/stories";
import { HomeSection, HomeSectionGrid } from "@/components/home/HomeSection";
import { ContentCard } from "@/components/content/ContentCard";
import type { Viewer } from "@/lib/server/visibility";

export async function SuggestedStoriesSection({ viewer }: { viewer: NonNullable<Viewer> }) {
  const stories = await listSuggestedStories(viewer, 3);
  if (stories.length === 0) return null;

  return (
    <HomeSection title="Suggested stories" subtitle="Ongoing and completed stories from the wider community.">
      <HomeSectionGrid>
        {stories.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </HomeSectionGrid>
    </HomeSection>
  );
}
