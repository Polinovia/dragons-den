import { ContentCard } from "@/components/content/ContentCard";
import type { ContentSummary } from "@/lib/types";

export function StoryCard({ item }: { item: ContentSummary & { kind: "STORY" } }) {
  return <ContentCard item={item} />;
}
