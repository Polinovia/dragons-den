import { listSketchesOpenForContinuation } from "@/lib/server/sketches";
import { HomeSection, HomeSectionGrid } from "@/components/home/HomeSection";
import { ContentCard } from "@/components/content/ContentCard";
import type { Viewer } from "@/lib/server/visibility";

export async function ContinueWritingSection({ viewer }: { viewer: NonNullable<Viewer> }) {
  const sketches = await listSketchesOpenForContinuation(viewer, 3);
  if (sketches.length === 0) return null;

  return (
    <HomeSection title="Continue writing" subtitle="Sketches from friends that are open for a continuation.">
      <HomeSectionGrid>
        {sketches.map((s) => (
          <ContentCard key={s.id} item={s} />
        ))}
      </HomeSectionGrid>
    </HomeSection>
  );
}
