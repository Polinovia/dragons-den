"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-serif text-6xl font-semibold text-muted-foreground">Oops</p>
      <h1 className="font-serif text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">
        That wasn&apos;t supposed to happen. You can try again, or head back home.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
        <Button render={<Link href="/" />} nativeButton={false}>
          Back home
        </Button>
      </div>
    </div>
  );
}
