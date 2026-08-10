import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-serif text-6xl font-semibold text-muted-foreground">404</p>
      <h1 className="font-serif text-2xl font-semibold">This page doesn&apos;t exist</h1>
      <p className="text-muted-foreground">
        It might be private, it might have been removed, or it might never have existed at all.
      </p>
      <Button render={<Link href="/" />} nativeButton={false}>
        Back home
      </Button>
    </div>
  );
}
