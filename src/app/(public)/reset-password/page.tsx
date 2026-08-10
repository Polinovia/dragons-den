import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set new password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/feed");

  const { token } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center gap-8 px-4 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-semibold">Set a new password</h1>
      </div>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-destructive">This reset link is missing its token.</p>
          <Link href="/forgot-password" className="text-sm font-medium text-foreground underline underline-offset-2">
            Request a new link
          </Link>
        </div>
      )}
    </div>
  );
}
