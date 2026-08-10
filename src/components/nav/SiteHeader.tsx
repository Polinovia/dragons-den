import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserMenu } from "@/components/nav/UserMenu";
import { MobileNav } from "@/components/nav/MobileNav";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 supports-[backdrop-filter]:backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-serif text-xl font-semibold tracking-tight">
            Dragon&apos;s Den
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link href="/explore" className="transition-colors hover:text-foreground">
              Explore
            </Link>
            {user ? (
              <Link href="/feed" className="transition-colors hover:text-foreground">
                Feed
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Button render={<Link href="/create" />} nativeButton={false} size="sm" className="hidden sm:inline-flex">
                Create
              </Button>
              <UserMenu username={user.username} displayName={user.displayName} avatarUrl={user.avatarUrl} />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm">
                Sign in
              </Button>
              <Button render={<Link href="/register" />} nativeButton={false} size="sm">
                Join
              </Button>
            </div>
          )}
          <MobileNav isAuthed={!!user} />
        </div>
      </div>
    </header>
  );
}
