"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const authError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(
    authError === "auth" ? "Sign-in failed. Try again." : null,
  );
  const [busy, setBusy] = useState(false);

  const supabase = createClient();

  function formatAuthError(error: { message: string; code?: string }) {
    const msg = error.message.toLowerCase();
    if (msg.includes("provider is not enabled")) {
      return "That sign-in method is turned off in Supabase. Enable it under Authentication → Providers (Email or Google).";
    }
    return error.message;
  }

  async function handleGoogle() {
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setMessage(formatAuthError(error));
      setBusy(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);

    if (mode === "sign-up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setMessage(formatAuthError(error));
        setBusy(false);
        return;
      }
      setMessage("Check your email to confirm your account, then sign in.");
      setBusy(false);
      setMode("sign-in");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(formatAuthError(error));
      setBusy(false);
      return;
    }
    router.replace(next as "/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-8 shadow-xl">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-[var(--color-text-strong)]">
          Pulse Tracker
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Sign in to plan, learn, and grow
        </p>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void handleGoogle()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] disabled:opacity-50"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
        <span className="h-px flex-1 bg-[var(--color-border)]" />
        or email
        <span className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <form onSubmit={(e) => void handleEmail(e)} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[var(--color-muted)]">
            Email
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[var(--color-muted)]">
            Password
          </span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={
              mode === "sign-up" ? "new-password" : "current-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        {message && (
          <p className="text-sm text-[var(--color-danger)]" role="alert">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[#042f2e] transition hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
        >
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-muted)]">
        {mode === "sign-in" ? (
          <>
            New here?{" "}
            <button
              type="button"
              className="text-[var(--color-accent)] hover:underline"
              onClick={() => setMode("sign-up")}
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              className="text-[var(--color-accent)] hover:underline"
              onClick={() => setMode("sign-in")}
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
