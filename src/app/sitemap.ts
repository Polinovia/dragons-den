import type { MetadataRoute } from "next";
import { listExplorePublicSketches } from "@/lib/server/sketches";
import { listExplorePublicStories } from "@/lib/server/stories";
import { listExplorePublicCollections } from "@/lib/server/collections";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Public-only by construction: every list* call here goes through the same
 * publicOnlyFilter() used by Explore, regardless of who (if anyone) requests this route. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sketches, stories, collections] = await Promise.all([
    listExplorePublicSketches({ take: 1000 }),
    listExplorePublicStories({ take: 1000 }),
    listExplorePublicCollections({ take: 1000 }),
  ]);

  return [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/explore`, changeFrequency: "hourly", priority: 0.9 },
    ...sketches.map((s) => ({
      url: `${BASE_URL}/sketches/${s.id}`,
      lastModified: s.createdAt,
      changeFrequency: "weekly" as const,
    })),
    ...stories.map((s) => ({
      url: `${BASE_URL}/stories/${s.slug}`,
      lastModified: s.createdAt,
      changeFrequency: "weekly" as const,
    })),
    ...collections.map((c) => ({
      url: `${BASE_URL}/collections/${c.id}`,
      lastModified: c.createdAt,
      changeFrequency: "weekly" as const,
    })),
  ];
}
