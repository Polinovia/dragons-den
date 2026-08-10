import { ContentCard } from "@/components/content/ContentCard";
import type { ContentSummary } from "@/lib/types";

export function ThoughtCard({ item }: { item: ContentSummary & { kind: "THOUGHT" } }) {
  return <ContentCard item={item} />;
}
