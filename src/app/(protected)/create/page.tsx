import type { Metadata } from "next";
import { CreateTabs } from "@/components/forms/CreateTabs";

export const metadata: Metadata = { title: "Create" };

export default function CreatePage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Start something new</h1>
        <p className="text-sm text-muted-foreground">A sketch, a thought, or the beginning of a story.</p>
      </div>
      <CreateTabs />
    </div>
  );
}
