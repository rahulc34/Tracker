"use client";

import { useAuth } from "@/contexts/auth-context";

export function AuthGate({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { loading, api } = useAuth();

  if (loading) {
    return (
      fallback ?? (
        <div className="flex h-64 items-center justify-center text-[var(--color-muted)]">
          Loading…
        </div>
      )
    );
  }

  if (!api) {
    return null;
  }

  return <>{children}</>;
}
