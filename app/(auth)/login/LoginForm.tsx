"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/app/auth/actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const urlError = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(urlError);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(data);
      if (!result.success) {
        setServerError(result.error || "Failed to sign in. Please check your credentials.");
      } else {
        const destination =
          result.data && typeof result.data === "object" && "redirectTo" in result.data
            ? (result.data as { redirectTo: string }).redirectTo
            : redirectUrl;
        router.push(destination);
        router.refresh();
      }
    });
  };

  return (
    <Card className="border-border bg-bg-card shadow-lg">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your Senitor account to resume your DSA journey
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password-input"
                className="block text-sm font-medium text-text-primary"
              >
                Password <span className="text-error">*</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-accent-secondary hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password-input"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
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

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={isPending}
            className="mt-2"
          >
            Sign In
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center border-t border-border pt-4">
        <p className="text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-accent-primary hover:text-accent-secondary transition-colors"
          >
            Sign up for free
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
