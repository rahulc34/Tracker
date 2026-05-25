-- Link tracker users to Supabase Auth (id matches auth.users.id for new sign-ups).
ALTER TABLE "tracker_users" ADD COLUMN IF NOT EXISTS "supabase_auth_id" UUID;
ALTER TABLE "tracker_users" ADD COLUMN IF NOT EXISTS "email" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "tracker_users_supabase_auth_id_key"
  ON "tracker_users"("supabase_auth_id");
