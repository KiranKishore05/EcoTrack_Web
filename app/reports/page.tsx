'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileBarChart, Calendar, Download, Loader2, Bell, Target,
  Flame, Leaf, TrendingDown, Sparkles, ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { generateWeeklyReport } from '@/lib/ai-engine';
import { computeCategoryBreakdown, computeSustainabilityIndex } from '@/lib/carbon-engine';
import type { Activity, Goal, Report, ReportPeriod } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { user, profile } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState<ReportPeriod>('weekly');

  const load = useCallback(async () => {
    if (!user) return;
    const [actRes, goalRes, repRes] = await Promise.all([
      supabase.from('activities').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);
    setActivities((actRes.data ?? []) as Activity[]);
    setGoals((goalRes.data ?? []) as Goal[]);
    setReports((repRes.data ?? []) as Report[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 600));

    const now = new Date();
    let startDate: Date;
    if (period === 'daily') {
      startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      startDate = new Date(now); startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const startIso = startDate.toISOString().slice(0, 10);
    const endIso = now.toISOString().slice(0, 10);
    const periodActivities = activities.filter((a) => a.date >= startIso && a.date <= endIso);

    const budget = 300;
    const sustainabilityIndex = profile?.sustainability_index ?? computeSustainabilityIndex(activities, budget);
    const report = generateWeeklyReport({
      activities: periodActivities,
      goals,
      budget,
      sustainabilityIndex,
      streak: profile?.current_streak ?? 0,
    });

    const totalCo2 = periodActivities.reduce((s, a) => s + a.co2_kg, 0);
    const { error } = await supabase.from('reports').insert({
      user_id: user.id,
      period,
      start_date: startIso,
      end_date: endIso,
      summary: report.summary,
      impact_score: sustainabilityIndex,
      total_co2_kg: Math.round(totalCo2 * 10) / 10,
      payload: report as unknown as Record<string, unknown>,
    });

    if (error) {
      toast.error('Failed to generate report');
    } else {
      toast.success(`${period.charAt(0).toUpperCase() + period.slice(1)} report generated`);
      load();
    }
    setGenerating(false);
  };

  // Build notifications from current state
  const notifications: Array<{ type: string; title: string; desc: string; icon: React.ElementType; color: string }> = [];
  if (profile && profile.current_streak >= 3) {
    notifications.push({
      type: 'streak',
      title: `${profile.current_streak}-day streak!`,
      desc: 'Keep logging daily to maintain your momentum.',
      icon: Flame,
      color: 'text-chart-4',
    });
  }
  if (profile && profile.sustainability_index >= 75) {
    notifications.push({
      type: 'achievement',
      title: 'High sustainability index',
      desc: `Your index is ${profile.sustainability_index}/100. Excellent work!`,
      icon: Leaf,
      color: 'text-primary',
    });
  }
  const activeGoals = goals.filter((g) => g.status === 'active');
  if (activeGoals.length > 0) {
    notifications.push({
      type: 'goal',
      title: `${activeGoals.length} active goal${activeGoals.length > 1 ? 's' : ''}`,
      desc: 'Check your progress and stay on track.',
      icon: Target,
      color: 'text-chart-3',
    });
  }
  notifications.push({
    type: 'report',
    title: 'Weekly report ready',
    desc: 'Generate your latest sustainability report to see trends.',
    icon: FileBarChart,
    color: 'text-chart-2',
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports & Notifications</h1>
        <p className="text-muted-foreground mt-1">Generate sustainability reports and stay updated with insights.</p>
      </div>

      {/* Notifications */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> Notifications
        </h3>
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-4 rounded-xl border border-border/50 glass hover:bg-muted/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <n.icon className={`w-4 h-4 ${n.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{n.title}</h4>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Generate report */}
      <Card className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Generate Report</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <FileBarChart className="w-4 h-4" /> Generate
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Reports history */}
      <div>
        <h3 className="font-semibold mb-3">Report History</h3>
        {reports.length === 0 ? (
          <Card className="glass rounded-2xl p-10 text-center">
            <FileBarChart className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              No reports yet. Generate your first sustainability report above.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {reports.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileBarChart className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold capitalize">{r.period} Report</h4>
                            <Badge variant="secondary" className="text-xs">
                              Impact: {r.impact_score}/100
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(r.start_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} — {new Date(r.end_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Total CO₂</div>
                          <div className="text-lg font-bold text-gradient">{r.total_co2_kg} kg</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.summary}</p>
                    {r.payload && typeof r.payload === 'object' && 'weekly_goals' in r.payload && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="text-xs font-semibold text-muted-foreground mb-2">Weekly Goals</div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {((r.payload as { weekly_goals: Array<{ title: string; target: string }> }).weekly_goals ?? []).map((g, gi) => (
                            <div key={gi} className="glass rounded-lg p-2.5">
                              <div className="text-xs text-primary font-medium">{g.target}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{g.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
