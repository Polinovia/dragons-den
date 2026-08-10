import { ContinueWritingSection } from "@/components/home/ContinueWritingSection";
import { RecentFromFriendsSection } from "@/components/home/RecentFromFriendsSection";
import { RecentlyCreatedSection } from "@/components/home/RecentlyCreatedSection";
import { YourDraftsSection } from "@/components/home/YourDraftsSection";
import { SuggestedStoriesSection } from "@/components/home/SuggestedStoriesSection";
import { YourCollectionsSection } from "@/components/home/YourCollectionsSection";
import type { Viewer } from "@/lib/server/visibility";

export function HomeDashboard({ viewer }: { viewer: NonNullable<Viewer> }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6">
      <ContinueWritingSection viewer={viewer} />
      <RecentFromFriendsSection viewer={viewer} />
      <YourDraftsSection viewer={viewer} />
      <RecentlyCreatedSection viewer={viewer} />
      <SuggestedStoriesSection viewer={viewer} />
      <YourCollectionsSection viewer={viewer} />
    </div>
  );
}
