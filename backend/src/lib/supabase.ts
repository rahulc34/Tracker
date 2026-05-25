import { createClient, type User } from "@supabase/supabase-js";
import ws from "ws";
import { config } from "../config.js";

let admin: ReturnType<typeof createClient> | null = null;

function getAdmin() {
  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  admin ??= createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Node 20 has no native WebSocket; required for @supabase/realtime-js init.
    realtime: {
      // ws matches runtime requirement; types differ from browser WebSocket.
      transport: ws as import("@supabase/realtime-js").WebSocketLikeConstructor,
    },
  });
  return admin;
}

export async function verifyAccessToken(
  accessToken: string,
): Promise<User | null> {
  const client = getAdmin();
  if (!client) return null;
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}
