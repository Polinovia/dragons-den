import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { HomeDashboard } from "@/components/home/HomeDashboard";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    return <HomeDashboard viewer={{ id: session.user.id }} />;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
      <div className="relative h-40 w-80 sm:h-48 sm:w-96">
        <Image
          src="/day-img.webp"
          alt="A dragon curled around a nest of old books"
          fill
          priority
          className="object-contain dark:hidden"
          sizes="384px"
        />
        <Image
          src="/night-img.webp"
          alt="A dragon curled around a nest of old books, under a night sky"
          fill
          priority
          className="hidden object-contain dark:block"
          sizes="384px"
        />
      </div>
      <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        A quiet corner of the internet
      </span>
      <h1 className="font-serif text-4xl leading-tight font-semibold text-balance sm:text-5xl">
        A cozy space for unfinished ideas
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground text-balance">
        Share a fragment. Leave a thought. Continue someone else&apos;s story. Dragon&apos;s Den is a small,
        private-by-default place for you and your friends to write things that don&apos;t need to be
        finished to be worth sharing.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button render={<Link href="/register" />} nativeButton={false} size="lg">
          Join the space
        </Button>
        <Button render={<Link href="/explore" />} nativeButton={false} variant="outline" size="lg">
          See what people are writing
        </Button>
      </div>
      <blockquote className="prose-content mt-8 max-w-lg text-muted-foreground italic">
        &ldquo;She woke up on a train, but couldn&apos;t remember where it was going.&rdquo;
      </blockquote>
    </div>
  );
}
