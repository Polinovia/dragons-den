import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { RegisterForm } from "@/components/forms/RegisterForm";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/feed");

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center gap-8 px-4 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-semibold">Join the space</h1>
        <p className="text-sm text-muted-foreground">A quiet corner for unfinished ideas.</p>
      </div>
      <RegisterForm />
    </div>
  );
}
