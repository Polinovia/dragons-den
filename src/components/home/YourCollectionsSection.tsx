import Link from "next/link";
import { Library } from "lucide-react";
import { listCollectionsForOwnerOrContributor } from "@/lib/server/collections";
import { HomeSection, HomeSectionGrid } from "@/components/home/HomeSection";
import { CollectionCard } from "@/components/content/CollectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import type { Viewer } from "@/lib/server/visibility";

export async function YourCollectionsSection({ viewer }: { viewer: NonNullable<Viewer> }) {
  const collections = await listCollectionsForOwnerOrContributor(viewer.id, viewer, 6);

  return (
    <HomeSection title="Your collections" subtitle="Worlds and groupings you're part of.">
      {collections.length === 0 ? (
        <EmptyState
          icon={<Library className="size-6" />}
          title="No collections yet"
          description="Group related sketches, stories, and notes into a world of their own."
          action={
            <Button size="sm" render={<Link href="/create" />} nativeButton={false}>
              Start a collection
            </Button>
          }
        />
      ) : (
        <HomeSectionGrid>
          {collections.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </HomeSectionGrid>
      )}
    </HomeSection>
  );
}
