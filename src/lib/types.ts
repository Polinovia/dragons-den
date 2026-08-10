import type { Visibility } from "@prisma/client";

export type ContentKind = "SKETCH" | "STORY" | "THOUGHT";

export type AuthorSummary = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
};

/** Normalized shape every ContentCard variant renders from, regardless of underlying model. */
export type ContentSummary = {
  kind: ContentKind;
  id: string;
  slug?: string;
  title: string | null;
  excerpt: string;
  author: AuthorSummary;
  visibility: Visibility;
  createdAt: Date;
  likeCount: number;
  commentCount: number;
  tags: string[];
  continuationCount?: number;
  status?: string;
};
