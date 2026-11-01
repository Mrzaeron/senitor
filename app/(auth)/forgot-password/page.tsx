"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/app/auth/actions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await forgotPasswordAction(data);
      if (!result.success) {
        setServerError(result.error || "Failed to send reset email. Please try again.");
      } else {
        setSubmittedEmail(data.email);
      }
    });
  };

  if (submittedEmail) {
    return (
      <Card className="border-border bg-bg-card shadow-lg text-center">
        <CardHeader className="items-center pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-muted text-success mb-2">
            <CheckCircle2 size={24} aria-hidden />
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Inbox</CardTitle>
          <CardDescription>
            We have sent password reset instructions to <strong className="text-text-primary">{submittedEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            Follow the secure link in the email to choose a new password. The link will remain active for 60 minutes.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pt-2 border-t border-border">
          <Link href="/login" className="w-full">
            <Button variant="secondary" size="md" fullWidth leftIcon={<ArrowLeft size={16} />}>
              Back to Sign In
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-bg-card shadow-lg">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
        <CardDescription>
          Enter your registered email address and we&apos;ll send you a password reset link
        </CardDescription>
      </CardHeader>

      <CardContent>
        {serverError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-lg border border-error/40 bg-error-muted/30 p-3 text-xs text-error"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="you@domain.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              required
              {...register("email")}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={isPending}
            className="mt-2"
          >
            Send Reset Link
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-border pt-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} aria-hidden />
          <span>Back to Sign In</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
