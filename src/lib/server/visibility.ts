import { Visibility } from "@prisma/client";

/** The currently signed-in user, or null for an anonymous visitor. */
export type Viewer = { id: string } | null;

type VisibilityFilter =
  | { visibility: typeof Visibility.PUBLIC }
  | {
      OR: [
        { visibility: typeof Visibility.PUBLIC },
        { authorId: string },
        { visibility: typeof Visibility.FRIENDS; authorId: { in: string[] } },
      ];
    };

/**
 * Prisma where-fragment for any model shaped like `{ authorId, visibility }`
 * (Sketch, Story, Thought). Anonymous visitors only ever see PUBLIC content.
 */
export function visibilityFilter(viewer: Viewer, friendIds: string[]): VisibilityFilter {
  if (!viewer) {
    return { visibility: Visibility.PUBLIC };
  }
  return {
    OR: [
      { visibility: Visibility.PUBLIC },
      { authorId: viewer.id },
      { visibility: Visibility.FRIENDS, authorId: { in: friendIds } },
    ],
  };
}

/** Same shape, but always PUBLIC-only — for Explore and the sitemap, which are public surfaces by contract. */
export function publicOnlyFilter(): { visibility: typeof Visibility.PUBLIC } {
  return { visibility: Visibility.PUBLIC };
}

export function canView(
  viewer: Viewer,
  content: { authorId: string; visibility: Visibility },
  friendIds: string[],
): boolean {
  if (content.visibility === Visibility.PUBLIC) return true;
  if (!viewer) return false;
  if (content.authorId === viewer.id) return true;
  if (content.visibility === Visibility.FRIENDS) return friendIds.includes(content.authorId);
  return false;
}
