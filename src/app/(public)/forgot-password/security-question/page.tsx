import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { SecurityQuestionResetForm } from "@/components/forms/SecurityQuestionResetForm";

export const metadata: Metadata = {
  title: "Reset with security question",
};

export default async function SecurityQuestionResetPage() {
  const session = await auth();
  if (session?.user) redirect("/feed");

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center gap-8 px-4 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-semibold">Reset with your security question</h1>
        <p className="text-sm text-muted-foreground">Enter the email on your account.</p>
      </div>
      <SecurityQuestionResetForm />
    </div>
  );
}
