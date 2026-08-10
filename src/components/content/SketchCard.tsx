import { ContentCard } from "@/components/content/ContentCard";
import type { ContentSummary } from "@/lib/types";

export function SketchCard({ item }: { item: ContentSummary & { kind: "SKETCH" } }) {
  return <ContentCard item={item} />;
}
