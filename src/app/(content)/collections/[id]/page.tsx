import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCollectionById } from "@/lib/server/collections";
import { UserAvatar } from "@/components/common/UserAvatar";
import { VisibilityBadge } from "@/components/content/VisibilityBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Library } from "lucide-react";

async function loadCollection(id: string) {
  const session = await auth();
  const viewer = session?.user ? { id: session.user.id } : null;
  return getCollectionById(id, viewer);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const collection = await loadCollection(id);
  return { title: collection?.name ?? "Collection" };
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = await loadCollection(id);
  if (!collection) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/profile/${collection.owner.username}`} className="flex items-center gap-2 hover:underline">
            <UserAvatar avatarUrl={collection.owner.avatarUrl} displayName={collection.owner.displayName} size="sm" />
            <span>{collection.owner.displayName}</span>
          </Link>
          <VisibilityBadge visibility={collection.visibility} className="ml-auto" />
        </div>
        <h1 className="font-serif text-3xl font-semibold">{collection.name}</h1>
        {collection.description ? <p className="text-muted-foreground">{collection.description}</p> : null}
        {collection.contributors.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            With {collection.contributors.map((c) => c.displayName).join(", ")}
          </p>
        ) : null}
      </div>

      {collection.items.length === 0 ? (
        <EmptyState icon={<Library className="size-6" />} title="Nothing added yet" />
      ) : (
        <div className="flex flex-col gap-3">
          {collection.items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border p-4">
              {item.href ? (
                <Link href={item.href} className="font-medium hover:underline">
                  {item.title ?? "Untitled"}
                </Link>
              ) : (
                <p className="font-medium">{item.title ?? (item.itemType === "NOTE" ? "Note" : "Untitled")}</p>
              )}
              {item.excerpt ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.excerpt}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
