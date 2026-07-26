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
    const thirtyDaysIso = thirtyDaysAgo.toISOString().slice(0, 10);

    const [actRes, budgetRes] = await Promise.all([
      supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
      supabase
        .from('carbon_budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const allActs = (actRes.data ?? []) as Activity[];
    const recentActs = allActs.filter(a => a.date >= thirtyDaysIso);
    
    setActivities(recentActs);
    setBudget(budgetRes.data as CarbonBudget | null);

    const budgetKg = budgetRes.data?.budget_kg ?? 300;
    const breakdown = computeCategoryBreakdown(recentActs);
    const trend = computeTrend(recentActs, 14);
    const totalCo2 = recentActs.reduce((s, a) => s + a.co2_kg, 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthCo2 = recentActs
      .filter((a) => new Date(a.date) >= monthStart)
      .reduce((s, a) => s + a.co2_kg, 0);
    const sustainabilityIndex = profile?.sustainability_index ?? computeSustainabilityIndex(recentActs, budgetKg);

    // Compute Heatmap Data (last 365 days)
    const heatmapMap = new Map<string, number>();
    allActs.forEach(a => {
      const date = a.date.slice(0, 10);
      heatmapMap.set(date, (heatmapMap.get(date) || 0) + 1);
    });
    
    const heatmapData = Array.from(heatmapMap.entries()).map(([date, count]) => {
      let level = 0;
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count === 3) level = 3;
      else if (count >= 4) level = 4;
      return { date, count, level };
    });

    setStats({
      totalCo2: Math.round(totalCo2 * 10) / 10,
      dailyAverage: recentActs.length > 0 ? Math.round((totalCo2 / 30) * 10) / 10 : 0,
      categoryBreakdown: breakdown,
      trend,
      budgetUsed: Math.round(monthCo2 * 10) / 10,
      budgetRemaining: Math.round((budgetKg - monthCo2) * 10) / 10,
      sustainabilityIndex,
      streak: profile?.current_streak ?? 0,
      level: profile?.level ?? 1,
      totalXp: profile?.total_xp ?? 0,
      heatmapData,
    });
    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    load();
  }, [load]);

  return { activities, budget, stats, loading, reload: load, refreshProfile };
}
