import type { AuthorSummary } from "@/lib/types";

export const AUTHOR_SELECT = {
  id: true,
  username: true,
  profile: { select: { displayName: true, avatarUrl: true } },
} as const;

type UserWithProfile = {
  id: string;
  username: string;
  profile: { displayName: string; avatarUrl: string } | null;
};

export function toAuthorSummary(user: UserWithProfile): AuthorSummary {
  return {
    id: user.id,
    username: user.username,
    displayName: user.profile?.displayName ?? user.username,
    avatarUrl: user.profile?.avatarUrl ?? "/avatars/default.svg",
  };
}

export function excerpt(body: string, maxLength = 220): string {
  const trimmed = body.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}
