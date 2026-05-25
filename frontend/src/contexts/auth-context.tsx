"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createApi, type TrackerApi } from "@/lib/api";
import { getApiBase } from "@/lib/constants";
import type { TrackerUser } from "@/lib/types";

type AuthState = {
  session: Session | null;
  user: User | null;
  trackerUser: TrackerUser | null;
  api: TrackerApi | null;
  loading: boolean;
  syncError: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function syncTrackerUser(
  accessToken: string,
  profile: { email?: string | null; name?: string },
): Promise<TrackerUser> {
  const res = await fetch(`${getApiBase()}/api/auth/session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      detail || `Tracker API error (${res.status}). Is the backend running on port 4001?`,
    );
  }
  return res.json() as Promise<TrackerUser>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [trackerUser, setTrackerUser] = useState<TrackerUser | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured());

  const supabase = useMemo(
    () => (isSupabaseConfigured() ? createClient() : null),
    [],
  );

  const getAccessToken = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, [supabase]);

  const api = useMemo(() => {
    if (!trackerUser) return null;
    return createApi(trackerUser.id, getAccessToken);
  }, [trackerUser, getAccessToken]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const applySession = async (next: Session | null) => {
      setSession(next);
      setUser(next?.user ?? null);
      if (!next?.access_token || !next.user) {
        setTrackerUser(null);
        setSyncError(null);
        setLoading(false);
        return;
      }

      setSyncError(null);
      try {
        const meta = next.user.user_metadata as Record<string, unknown>;
        const name =
          (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          undefined;
        const tracker = await syncTrackerUser(next.access_token, {
          email: next.user.email,
          name,
        });
        setTrackerUser(tracker);
      } catch (err) {
        console.error(err);
        setTrackerUser(null);
        setSyncError(
          err instanceof Error ? err.message : "Failed to sync with Tracker API",
        );
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      void applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || loading || session) return;
    const path = window.location.pathname;
    if (path === "/login" || path.startsWith("/auth/")) return;
    window.location.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [supabase, loading, session]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setTrackerUser(null);
    setSyncError(null);
    window.location.href = "/login";
  }, [supabase]);

  const value = useMemo(
    () => ({
      session,
      user,
      trackerUser,
      api,
      loading,
      syncError,
      signOut,
    }),
    [session, user, trackerUser, api, loading, syncError, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useApi(): TrackerApi {
  const { api, loading } = useAuth();
  if (loading) {
    throw new Error("API not ready while auth is loading");
  }
  if (!api) {
    throw new Error("Not authenticated");
  }
  return api;
}
