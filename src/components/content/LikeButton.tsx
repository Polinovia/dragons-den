"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleLikeAction } from "@/actions/like";
import type { ContentType } from "@prisma/client";
import { cn } from "@/lib/utils";

export function LikeButton({
  contentType,
  contentId,
  initialCount,
  initialLiked,
  path,
}: {
  contentType: ContentType;
  contentId: string;
  initialCount: number;
  initialLiked: boolean;
  path: string;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    startTransition(async () => {
      const result = await toggleLikeAction(contentType, contentId, path);
      if ("error" in result) {
        setLiked(!nextLiked);
        setCount((c) => c + (nextLiked ? -1 : 1));
        return;
      }
      setCount(result.count);
      setLiked(result.likedByViewer);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={cn(liked && "border-primary text-primary")}
    >
      <Heart className={cn("size-4", liked && "fill-current")} /> {count}
    </Button>
  );
}
