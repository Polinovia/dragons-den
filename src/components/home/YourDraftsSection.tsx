import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { listDraftStoriesForViewer } from "@/lib/server/stories";
import { HomeSection, HomeSectionGrid } from "@/components/home/HomeSection";
import { ContentCard } from "@/components/content/ContentCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import type { Viewer } from "@/lib/server/visibility";

export async function YourDraftsSection({ viewer }: { viewer: NonNullable<Viewer> }) {
  const drafts = await listDraftStoriesForViewer(viewer, 6);

  return (
    <HomeSection title="Your drafts" subtitle="Stories you've started but haven't published yet.">
      {drafts.length === 0 ? (
        <EmptyState
          icon={<NotebookPen className="size-6" />}
          title="No drafts in progress"
          description="Start a new story and it'll wait here until you're ready to share it."
          action={
            <Button size="sm" render={<Link href="/create" />} nativeButton={false}>
              Start a story
            </Button>
          }
        />
      ) : (
        <HomeSectionGrid>
          {drafts.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </HomeSectionGrid>
      )}
    </HomeSection>
  );
}
