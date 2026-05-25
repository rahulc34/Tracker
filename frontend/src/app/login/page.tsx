import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-bg)] p-6">
      <Suspense
        fallback={
          <div className="text-sm text-[var(--color-muted)]">Loading…</div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
