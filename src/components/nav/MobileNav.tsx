"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";

type MobileNavProps = {
  isAuthed: boolean;
  username?: string;
  displayName?: string;
};

export function MobileNav({ isAuthed, username, displayName }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />}
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="font-serif">Dragon&apos;s Den</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4 text-base">
          <Link href="/explore" onClick={() => setOpen(false)} className="rounded-md px-2 py-2.5 hover:bg-accent">
            Explore
          </Link>
          {isAuthed ? (
            <>
              <Link href="/feed" onClick={() => setOpen(false)} className="rounded-md px-2 py-2.5 hover:bg-accent">
                Feed
              </Link>
              <Link href="/create" onClick={() => setOpen(false)} className="rounded-md px-2 py-2.5 hover:bg-accent">
                Create
              </Link>
              <Link
                href={`/profile/${username}`}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 hover:bg-accent"
              >
                {displayName ?? "Your profile"}
              </Link>
              <Link href="/settings" onClick={() => setOpen(false)} className="rounded-md px-2 py-2.5 hover:bg-accent">
                Settings
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-md px-2 py-2.5 hover:bg-accent">
                Sign in
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className="rounded-md px-2 py-2.5 hover:bg-accent">
                Join
              </Link>
            </>
          )}
        </nav>
        {isAuthed ? (
          <SheetFooter>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" className="w-full justify-start gap-1.5">
                <LogOut className="size-4" /> Sign out
              </Button>
            </form>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
