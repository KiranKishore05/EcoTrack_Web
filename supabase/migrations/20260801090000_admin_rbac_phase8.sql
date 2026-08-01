-- Phase 8: Admin RBAC, moderation, and analytics data structures

-- 1) Profiles: role + suspension state
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'moderator', 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- 2) Reports: moderation status
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reports_status_check'
      AND conrelid = 'public.reports'::regclass
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_status_check CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reports_status_created_at ON public.reports (status, created_at DESC);

-- 3) Challenges table for admin challenge moderation
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  target_co2_kg numeric NOT NULL DEFAULT 0,
  reward_xp integer NOT NULL DEFAULT 100,
  start_date date,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.challenges (is_active, created_at DESC);

DROP TRIGGER IF EXISTS challenges_updated_at ON public.challenges;
CREATE TRIGGER challenges_updated_at BEFORE UPDATE ON public.challenges
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Admin role helper in private schema
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_suspended = false
  ) INTO _is_admin;

  RETURN COALESCE(_is_admin, false);
END;
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- 5) Profiles policies: keep owner access + allow admins to manage all profiles
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "delete_own_profile" ON public.profiles;

CREATE POLICY "profiles_select_owner_or_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING ((auth.uid() = id) OR private.is_admin());

CREATE POLICY "profiles_insert_owner_or_admin"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = id) OR private.is_admin());

CREATE POLICY "profiles_update_owner_or_admin"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((auth.uid() = id) OR private.is_admin())
WITH CHECK ((auth.uid() = id) OR private.is_admin());

CREATE POLICY "profiles_delete_owner_or_admin"
ON public.profiles
FOR DELETE
TO authenticated
USING ((auth.uid() = id) OR private.is_admin());

-- 6) Reports policies: owner access + admin moderation
DROP POLICY IF EXISTS "select_own_reports" ON public.reports;
DROP POLICY IF EXISTS "insert_own_reports" ON public.reports;
DROP POLICY IF EXISTS "delete_own_reports" ON public.reports;
DROP POLICY IF EXISTS "reports_update_owner_or_admin" ON public.reports;

CREATE POLICY "reports_select_owner_or_admin"
ON public.reports
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR private.is_admin());

CREATE POLICY "reports_insert_owner_or_admin"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = user_id) OR private.is_admin());

CREATE POLICY "reports_update_owner_or_admin"
ON public.reports
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) OR private.is_admin())
WITH CHECK ((auth.uid() = user_id) OR private.is_admin());

CREATE POLICY "reports_delete_owner_or_admin"
ON public.reports
FOR DELETE
TO authenticated
USING ((auth.uid() = user_id) OR private.is_admin());

-- 7) Challenges RLS: authenticated users can read active challenges, admins can manage all
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenges_select_active_or_admin" ON public.challenges;
DROP POLICY IF EXISTS "challenges_insert_admin" ON public.challenges;
DROP POLICY IF EXISTS "challenges_update_admin" ON public.challenges;
DROP POLICY IF EXISTS "challenges_delete_admin" ON public.challenges;

CREATE POLICY "challenges_select_active_or_admin"
ON public.challenges
FOR SELECT
TO authenticated
USING (is_active = true OR private.is_admin());

CREATE POLICY "challenges_insert_admin"
ON public.challenges
FOR INSERT
TO authenticated
WITH CHECK (private.is_admin());

CREATE POLICY "challenges_update_admin"
ON public.challenges
FOR UPDATE
TO authenticated
USING (private.is_admin())
WITH CHECK (private.is_admin());

CREATE POLICY "challenges_delete_admin"
ON public.challenges
FOR DELETE
TO authenticated
USING (private.is_admin());
