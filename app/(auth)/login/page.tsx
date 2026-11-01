import { Suspense } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/Card";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="border-border bg-bg-card shadow-lg">
          <CardContent>
            <p className="text-sm text-text-secondary" role="status">
              Loading sign in...
            </p>
          </CardContent>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
