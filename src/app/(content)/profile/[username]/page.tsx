import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProfileByUsername } from "@/lib/server/profile";
import { UserAvatar } from "@/components/common/UserAvatar";
import { FriendButton } from "@/components/content/FriendButton";
import { ContentCard } from "@/components/content/ContentCard";
import { CollectionCard } from "@/components/content/CollectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

async function loadProfile(username: string) {
  const session = await auth();
  const viewer = session?.user ? { id: session.user.id } : null;
  return getProfileByUsername(username, viewer);
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const profile = await loadProfile(username);
  return { title: profile?.displayName ?? "Profile" };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await loadProfile(username);
  if (!profile) notFound();

  const path = `/profile/${username}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <UserAvatar avatarUrl={profile.avatarUrl} displayName={profile.displayName} size="lg" />
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="font-serif text-2xl font-semibold">{profile.displayName}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio ? <p className="max-w-md pt-1 text-sm">{profile.bio}</p> : null}
          <div className="flex items-center justify-center gap-4 pt-1 text-sm text-muted-foreground sm:justify-start">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" /> {profile.friendCount} friends
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3.5" /> Joined {profile.memberSince.getFullYear()}
            </span>
          </div>
        </div>
        <FriendButton state={profile.friendshipState} username={profile.username} userId={profile.id} path={path} />
      </div>

      <Tabs defaultValue="sketches">
        <TabsList>
          <TabsTrigger value="sketches">Sketches</TabsTrigger>
          <TabsTrigger value="stories">Stories</TabsTrigger>
          <TabsTrigger value="thoughts">Thoughts</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>

        <TabsContent value="sketches" className="pt-6">
          {profile.sketches.length === 0 ? (
            <EmptyState title="No sketches yet" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {profile.sketches.map((s) => (
                <ContentCard key={s.id} item={s} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stories" className="pt-6">
          {profile.stories.length === 0 ? (
            <EmptyState title="No stories yet" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {profile.stories.map((s) => (
                <ContentCard key={s.id} item={s} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="thoughts" className="pt-6">
          {profile.thoughts.length === 0 ? (
            <EmptyState title="No thoughts yet" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {profile.thoughts.map((t) => (
                <ContentCard key={t.id} item={t} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="collections" className="pt-6">
          {profile.collections.length === 0 ? (
            <EmptyState title="No collections yet" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {profile.collections.map((c) => (
                <CollectionCard key={c.id} collection={c} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
