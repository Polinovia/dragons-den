import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const SIZES = { sm: "size-6", md: "size-8", lg: "size-12" } as const;

export function UserAvatar({
  avatarUrl,
  displayName,
  size = "md",
  className,
}: {
  avatarUrl: string;
  displayName: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <Avatar className={cn(SIZES[size], className)}>
      <AvatarImage src={avatarUrl} alt="" />
      <AvatarFallback>{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
