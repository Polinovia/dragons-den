import { prisma } from "@/lib/prisma";

/** Picks a uniformly random PUBLIC sketch or story and returns its detail-page URL. */
export async function getRandomPublicContentLink(): Promise<string | null> {
  const [sketchCount, storyCount] = await Promise.all([
    prisma.sketch.count({ where: { visibility: "PUBLIC" } }),
    prisma.story.count({ where: { visibility: "PUBLIC" } }),
  ]);
  const total = sketchCount + storyCount;
  if (total === 0) return null;

  const pick = Math.floor(Math.random() * total);

  if (pick < sketchCount) {
    const sketch = await prisma.sketch.findFirst({
      where: { visibility: "PUBLIC" },
      skip: pick,
      select: { id: true },
    });
    return sketch ? `/sketches/${sketch.id}` : null;
  }

  const story = await prisma.story.findFirst({
    where: { visibility: "PUBLIC" },
    skip: pick - sketchCount,
    select: { slug: true },
  });
  return story ? `/stories/${story.slug}` : null;
}
