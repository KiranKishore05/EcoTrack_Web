/*
# EcoTrack — Core Sustainability Platform Schema

## Overview
Creates the full data model for EcoTrack, an AI-powered sustainability
management platform. Users log daily habits (transport, food, energy, water,
waste), the app calculates their carbon footprint, an AI engine generates
personalized eco recommendations, and a gamification layer awards badges, XP,
streaks, and levels.

## New Tables
1. `profiles` — per-user profile extending `auth.users`.
2. `activities` — daily habit log entries with computed co2_kg.
3. `carbon_budgets` — monthly carbon budget per user.
4. `recommendations` — AI-generated eco suggestions with structured JSON payload.
5. `goals` — user-defined sustainability goals.
6. `achievements` — earned badges keyed by badge_key.
7. `reports` — generated sustainability reports with JSON payload.

## Security
- RLS enabled on every table.
- All tables owner-scoped (user_id defaults to auth.uid()).
- Four CRUD policies per table, scoped TO authenticated with ownership checks.
*/

-- 1. profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  location text,
  bio text,
  sustainability_index numeric DEFAULT 50 NOT NULL,
  total_xp integer DEFAULT 0 NOT NULL,
  level integer DEFAULT 1 NOT NULL,
  current_streak integer DEFAULT 0 NOT NULL,
  longest_streak integer DEFAULT 0 NOT NULL,
  last_activity_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- 2. activities
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL CHECK (category IN ('transport','food','energy','water','waste')),
  type text NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  co2_kg numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_activities" ON activities;
CREATE POLICY "select_own_activities" ON activities FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_activities" ON activities;
CREATE POLICY "insert_own_activities" ON activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_activities" ON activities;
CREATE POLICY "update_own_activities" ON activities FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_activities" ON activities;
CREATE POLICY "delete_own_activities" ON activities FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_category ON activities (user_id, category);

-- 3. carbon_budgets
CREATE TABLE IF NOT EXISTS carbon_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  month date NOT NULL DEFAULT date_trunc('month', now())::date,
  budget_kg numeric NOT NULL DEFAULT 300,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, month)
);

ALTER TABLE carbon_budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_budgets" ON carbon_budgets;
CREATE POLICY "select_own_budgets" ON carbon_budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_budgets" ON carbon_budgets;
CREATE POLICY "insert_own_budgets" ON carbon_budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_budgets" ON carbon_budgets;
CREATE POLICY "update_own_budgets" ON carbon_budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_budgets" ON carbon_budgets;
CREATE POLICY "delete_own_budgets" ON carbon_budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  title text NOT NULL,
  description text NOT NULL,
  estimated_savings_kg numeric DEFAULT 0 NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','applied','dismissed')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_recommendations" ON recommendations;
CREATE POLICY "select_own_recommendations" ON recommendations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_recommendations" ON recommendations;
CREATE POLICY "insert_own_recommendations" ON recommendations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_recommendations" ON recommendations;
CREATE POLICY "update_own_recommendations" ON recommendations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_recommendations" ON recommendations;
CREATE POLICY "delete_own_recommendations" ON recommendations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_status ON recommendations (user_id, status);

-- 5. goals
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  target_value numeric NOT NULL,
  current_value numeric NOT NULL DEFAULT 0,
  unit text NOT NULL,
  deadline date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_goals" ON goals;
CREATE POLICY "select_own_goals" ON goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_goals" ON goals;
CREATE POLICY "insert_own_goals" ON goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_goals" ON goals;
CREATE POLICY "update_own_goals" ON goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_goals" ON goals;
CREATE POLICY "delete_own_goals" ON goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key text NOT NULL,
  earned_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, badge_key)
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_achievements" ON achievements;
CREATE POLICY "select_own_achievements" ON achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_achievements" ON achievements;
CREATE POLICY "insert_own_achievements" ON achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_achievements" ON achievements;
CREATE POLICY "delete_own_achievements" ON achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. reports
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  period text NOT NULL CHECK (period IN ('daily','weekly','monthly')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  summary text NOT NULL,
  impact_score numeric NOT NULL DEFAULT 0,
  total_co2_kg numeric NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_reports" ON reports;
CREATE POLICY "select_own_reports" ON reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_reports" ON reports;
CREATE POLICY "insert_own_reports" ON reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_reports" ON reports;
CREATE POLICY "delete_own_reports" ON reports FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reports_user_period ON reports (user_id, period, start_date DESC);

-- updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS carbon_budgets_updated_at ON carbon_budgets;
CREATE TRIGGER carbon_budgets_updated_at BEFORE UPDATE ON carbon_budgets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS recommendations_updated_at ON recommendations;
CREATE TRIGGER recommendations_updated_at BEFORE UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS goals_updated_at ON goals;
CREATE TRIGGER goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
