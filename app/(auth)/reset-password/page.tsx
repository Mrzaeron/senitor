"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { resetPasswordAction } from "@/app/auth/actions";
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
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: ResetPasswordInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await resetPasswordAction(data);
      if (!result.success) {
        setServerError(result.error || "Failed to reset password. Please try again.");
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 2000);
      }
    });
  };

  if (isSuccess) {
    return (
      <Card className="border-border bg-bg-card shadow-lg text-center">
        <CardHeader className="items-center pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-muted text-success mb-2">
            <CheckCircle2 size={24} aria-hidden />
          </div>
          <CardTitle className="text-2xl font-bold">Password Updated</CardTitle>
          <CardDescription>
            Your account password has been changed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary">
            Redirecting you to your Senitor dashboard...
          </p>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border pt-4">
          <Link href="/dashboard" className="w-full">
            <Button variant="primary" size="md" fullWidth>
              Go to Dashboard Now
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-bg-card shadow-lg">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
        <CardDescription>
          Enter your new password below to regain full access
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
            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters (letters + numbers)"
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="cursor-pointer text-text-muted hover:text-text-primary transition-colors focus:outline-none pointer-events-auto"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                error={errors.password?.message}
                required
                {...register("password")}
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="cursor-pointer text-text-muted hover:text-text-primary transition-colors focus:outline-none pointer-events-auto"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                error={errors.confirmPassword?.message}
                required
                {...register("confirmPassword")}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={isPending}
            className="mt-2"
          >
            Update Password
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-border pt-4">
        <Link
          href="/login"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Remember your password? Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
