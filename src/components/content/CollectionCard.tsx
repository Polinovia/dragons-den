import Link from "next/link";
import { Library } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { VisibilityBadge } from "@/components/content/VisibilityBadge";
import type { Visibility } from "@prisma/client";

export function CollectionCard({
  collection,
}: {
  collection: {
    id: string;
    name: string;
    description: string | null;
    visibility: Visibility;
    itemCount: number;
  };
}) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="block h-full rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Card className="h-full transition-shadow hover:shadow-md hover:ring-foreground/20">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Library className="size-4" />
              <span className="text-xs font-medium tracking-wide uppercase">Collection</span>
            </div>
            <VisibilityBadge visibility={collection.visibility} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <h3 className="font-serif text-lg leading-snug font-semibold">{collection.name}</h3>
          {collection.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{collection.description}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {collection.itemCount} item{collection.itemCount === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
