"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validations/auth";
import { submitOnboardingAction } from "@/app/auth/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { AlertCircle, User } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { fullName: "" },
    mode: "onChange",
  });

  const onSubmit = (data: OnboardingInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await submitOnboardingAction(data);
      if (!result.success) {
        setServerError(
          result.error || "Your profile could not be saved. Please try again."
        );
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <Card className="w-full border-border bg-bg-card shadow-lg">
      <CardHeader>
        <p className="text-sm font-medium text-accent-secondary">Account setup</p>
        <CardTitle className="text-2xl font-bold text-text-primary">
          Welcome to Senitor
        </CardTitle>
        <CardDescription>
          Add your name to get started. You can begin solving problems right away.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-error/40 bg-error-muted/30 p-3 text-sm text-error"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
              <span>{serverError}</span>
            </div>
          )}
          <Input
            label="Full name"
            placeholder="e.g. Maya Lin"
            leftIcon={<User size={16} />}
            error={errors.fullName?.message}
            autoComplete="name"
            required
            {...register("fullName")}
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-accent-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-primary/90 disabled:cursor-wait disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Continue to dashboard"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
