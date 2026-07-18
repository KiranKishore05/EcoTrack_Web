'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Activity, CarbonBudget, DashboardStats } from '@/lib/types';
import {
  computeCategoryBreakdown, computeTrend, computeSustainabilityIndex,
} from '@/lib/carbon-engine';

export function useDashboardData() {
  const { user, profile, refreshProfile } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [budget, setBudget] = useState<CarbonBudget | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const iso = thirtyDaysAgo.toISOString().slice(0, 10);

    const [actRes, budgetRes] = await Promise.all([
      supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', iso)
        .order('date', { ascending: false }),
      supabase
        .from('carbon_budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const acts = (actRes.data ?? []) as Activity[];
    setActivities(acts);
    setBudget(budgetRes.data as CarbonBudget | null);

    const budgetKg = budgetRes.data?.budget_kg ?? 300;
    const breakdown = computeCategoryBreakdown(acts);
    const trend = computeTrend(acts, 14);
    const totalCo2 = acts.reduce((s, a) => s + a.co2_kg, 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthCo2 = acts
      .filter((a) => new Date(a.date) >= monthStart)
      .reduce((s, a) => s + a.co2_kg, 0);
    const sustainabilityIndex = profile?.sustainability_index ?? computeSustainabilityIndex(acts, budgetKg);

    setStats({
      totalCo2: Math.round(totalCo2 * 10) / 10,
      dailyAverage: acts.length > 0 ? Math.round((totalCo2 / 30) * 10) / 10 : 0,
      categoryBreakdown: breakdown,
      trend,
      budgetUsed: Math.round(monthCo2 * 10) / 10,
      budgetRemaining: Math.round((budgetKg - monthCo2) * 10) / 10,
      sustainabilityIndex,
      streak: profile?.current_streak ?? 0,
      level: profile?.level ?? 1,
      totalXp: profile?.total_xp ?? 0,
    });
    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    load();
  }, [load]);

  return { activities, budget, stats, loading, reload: load, refreshProfile };
}
