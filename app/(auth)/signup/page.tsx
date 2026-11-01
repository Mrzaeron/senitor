"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { signupAction } from "@/app/auth/actions";
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
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: SignupInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await signupAction(data);
      if (!result.success) {
        setServerError(result.error || "Failed to create account. Please try again.");
      } else {
        const resultData = result.data as { requiresVerification?: boolean; redirectTo?: string } | undefined;
        if (resultData?.requiresVerification) {
          setRegisteredEmail(data.email);
          setVerificationRequired(true);
        } else if (resultData?.redirectTo) {
          router.push(resultData.redirectTo);
          router.refresh();
        } else {
          router.push("/onboarding");
          router.refresh();
        }
      }
    });
  };

  if (verificationRequired) {
    return (
      <Card className="border-border bg-bg-card shadow-lg text-center">
        <CardHeader className="items-center pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-muted text-success mb-2">
            <CheckCircle2 size={24} aria-hidden />
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            We sent a verification link to <strong className="text-text-primary">{registeredEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            Click the link in the email to activate your account and begin your personalized DSA onboarding.
          </p>
          <div className="rounded-lg border border-border bg-bg-secondary p-3 text-xs text-text-muted text-left">
            💡 <strong>Note:</strong> If you don&apos;t see the message within a couple of minutes, please check your spam folder.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pt-2 border-t border-border">
          <Link href="/login" className="w-full">
            <Button variant="secondary" size="md" fullWidth>
              Return to Sign In
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-bg-card shadow-lg">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
        <CardDescription>
          Master DSA with personalized AI-powered learning paths
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
              label="Full Name"
              type="text"
              autoComplete="name"
              placeholder="Alex Smith"
              leftIcon={<User size={16} />}
              error={errors.fullName?.message}
              required
              {...register("fullName")}
            />
          </div>

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

          <div>
            <div className="relative">
              <Input
                label="Password"
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
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
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
            Create Account
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center border-t border-border pt-4">
        <p className="text-sm text-text-secondary">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-accent-primary hover:text-accent-secondary transition-colors"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
