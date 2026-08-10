import { Lock, Users, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Visibility } from "@prisma/client";

const CONFIG = {
  PRIVATE: { label: "Private", icon: Lock },
  FRIENDS: { label: "Friends", icon: Users },
  PUBLIC: { label: "Public", icon: Globe },
} as const;

export function VisibilityBadge({ visibility, className }: { visibility: Visibility; className?: string }) {
  const { label, icon: Icon } = CONFIG[visibility];
  return (
    <Badge variant="outline" className={className}>
      <Icon /> {label}
    </Badge>
  );
}
