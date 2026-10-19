/*
  EcoTrack — Auto-Profile Trigger Migration

  PURPOSE
  -------
  Guarantees every user who signs up automatically gets a row in
  `public.profiles`. This is the ONLY place profile rows are created for
  new users — no client-side code, no manual steps, no per-login table ops.

  HOW IT WORKS
  ------------
  1. `handle_new_user()` — a SECURITY DEFINER function that fires AFTER a new
     row is inserted into `auth.users` (i.e., every signup).
  2. `on_auth_user_created` — the trigger that calls the function.
  3. Back-fill INSERT — one-time fix for accounts created before this trigger
     existed (safe to run multiple times thanks to ON CONFLICT DO NOTHING).

  RESULT
  ------
  - New users: profile is created automatically, zero manual steps needed.
  - Existing users without a profile: fixed by the back-fill below.
  - Subsequent calls: idempotent, no duplicate rows.

  PREREQUISITES
  -------------
  Run AFTER migrations:
    1. 20260717154445_ecotrack_schema.sql  (creates profiles table)
    2. 20260801090000_admin_rbac_phase8.sql (adds email column to profiles)
*/

-- 1. Create / replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Only fill in values that are null; never overwrite intentional edits
    display_name = COALESCE(
      public.profiles.display_name,
      EXCLUDED.display_name
    ),
    email = COALESCE(
      public.profiles.email,
      EXCLUDED.email
    );
  RETURN NEW;
END;
$$;

-- 2. Attach (or replace) the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Back-fill: fix any existing auth users that have no profiles row
--    Safe to re-run: ON CONFLICT DO NOTHING makes it idempotent
INSERT INTO public.profiles (id, display_name, email)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    split_part(u.email, '@', 1)
  ),
  u.email
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
