"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColdEmailIntakeForm } from "@/components/coldEmail/intake-form";
import { ColdEmailGenerationProgress } from "@/components/coldEmail/generation-progress";
import { useDataStore } from "@/lib/data/store";
import type { ColdEmailInput, ColdEmailResult } from "@/types/coldEmail";

type Step = "intake" | "generating";

export default function NewOutreachPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intake");
  const [input, setInput] = useState<ColdEmailInput | null>(null);
  const addColdEmail = useDataStore((s) => s.addColdEmail);

  function handleComplete(result: ColdEmailResult) {
    if (!input) return;
    const record = addColdEmail({
      label: `${input.recipientName} @ ${input.recipientCompany}`,
      input,
      result,
      followUps: [],
    });
    router.push(`/outreach/${record.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Outreach Email</h1>
        <p className="mt-1 text-muted-foreground">
          Tell us who you&apos;re contacting and why — the AI drafts a few strategically different, scored
          variants aimed at getting a reply.
        </p>
      </div>

      {step === "intake" && (
        <ColdEmailIntakeForm
          onSubmit={(i) => {
            setInput(i);
            setStep("generating");
          }}
        />
      )}

      {step === "generating" && input && (
        <ColdEmailGenerationProgress input={input} onComplete={handleComplete} onRetry={() => setStep("intake")} />
      )}
    </div>
  );
}
