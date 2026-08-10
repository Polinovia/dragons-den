import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const session = await auth();
  if (session?.user) redirect(callbackUrl ?? "/feed");

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center gap-8 px-4 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue writing.</p>
      </div>
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
