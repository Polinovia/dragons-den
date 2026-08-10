import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfileByUsername } from "@/lib/server/profile";
import { SettingsForm } from "@/components/forms/SettingsForm";
import { ThemeSettings } from "@/components/forms/ThemeSettings";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const profile = await getProfileByUsername(session.user.username, { id: session.user.id });
  if (!profile) notFound();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Username</span>
          <span className="font-medium">@{session.user.username}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{session.user.email}</span>
        </div>
      </div>

      <SettingsForm displayName={profile.displayName} bio={profile.bio ?? ""} locale={profile.locale} />

      <Separator />

      <ThemeSettings />
    </div>
  );
}
