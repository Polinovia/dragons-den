"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Shuffle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TYPES = [
  { value: "all", label: "All" },
  { value: "sketch", label: "Sketches" },
  { value: "story", label: "Stories" },
  { value: "thought", label: "Thoughts" },
  { value: "collection", label: "Worlds" },
];

const SORT_LABELS: Record<string, string> = {
  recent: "Recently created",
  popular: "Popular",
};

export function ExploreFilters({ tagLabel }: { tagLabel?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  const type = searchParams.get("type") ?? "all";
  const sort = searchParams.get("sort") ?? "recent";
  const tag = searchParams.get("tag");

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
    });
  }

  useEffect(() => {
    const currentQ = searchParams.get("q") ?? "";
    if (search === currentQ) return;
    const handle = setTimeout(() => updateParams({ q: search || null }), 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles and text…"
            className="pl-8"
            aria-label="Search public content"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(value) => updateParams({ sort: value === "recent" ? null : String(value) })}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort">
                {(value: string) => SORT_LABELS[value] ?? value}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently created</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" render={<a href="/explore/random" />} nativeButton={false}>
            <Shuffle /> Discover
          </Button>
        </div>
      </div>

      <Tabs value={type} onValueChange={(value) => updateParams({ type: value === "all" ? null : String(value) })}>
        <TabsList>
          {TYPES.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tag ? (
        <div>
          <Badge variant="secondary" className="gap-1.5">
            Tag: {tagLabel ?? tag}
            <button type="button" onClick={() => updateParams({ tag: null })} aria-label="Clear tag filter">
              <X className="size-3" />
            </button>
          </Badge>
        </div>
      ) : null}
    </div>
  );
}
