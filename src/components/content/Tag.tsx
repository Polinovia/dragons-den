import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { slugify } from "@/lib/slug";

export function Tag({ name, linked = false }: { name: string; linked?: boolean }) {
  if (!linked) {
    return (
      <Badge variant="secondary" className="font-normal">
        {name}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-normal" render={<Link href={`/explore?tag=${slugify(name)}`} />}>
      {name}
    </Badge>
  );
}
