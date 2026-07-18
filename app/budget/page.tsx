'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Target, TrendingDown, Gauge, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Activity, CarbonBudget } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function BudgetPage() {
  const { user } = useAuth();
  const [budget, setBudget] = useState<CarbonBudget | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [budgetInput, setBudgetInput] = useState('300');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const monthStart = new Date();
    monthStart.setDate(1);
    const [budgetRes, actRes] = await Promise.all([
      supabase
        .from('carbon_budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthStart.toISOString().slice(0, 10))
        .order('date', { ascending: true }),
    ]);
    setBudget(budgetRes.data as CarbonBudget | null);
    setActivities((actRes.data ?? []) as Activity[]);
    if (budgetRes.data) setBudgetInput(String(budgetRes.data.budget_kg));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const budgetKg = budget?.budget_kg ?? 300;
  const monthCo2 = activities.reduce((s, a) => s + a.co2_kg, 0);
  const usedPct = Math.min(100, Math.round((monthCo2 / budgetKg) * 100));
  const remaining = Math.round((budgetKg - monthCo2) * 10) / 10;

  // Daily cumulative data
  const dailyMap = new Map<string, number>();
  for (const a of activities) {
    dailyMap.set(a.date, (dailyMap.get(a.date) ?? 0) + a.co2_kg);
  }
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const chartData: Array<{ date: string; cumulative: number; budget_line: number }> = [];
  let cum = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(new Date().getFullYear(), new Date().getMonth(), d);
    const iso = dateObj.toISOString().slice(0, 10);
    cum += dailyMap.get(iso) ?? 0;
    const dailyBudget = (budgetKg / daysInMonth) * d;
    chartData.push({ date: iso.slice(8), cumulative: Math.round(cum * 10) / 10, budget_line: Math.round(dailyBudget * 10) / 10 });
  }

  // Prediction: average daily emission * remaining days
  const elapsedDays = new Date().getDate();
  const avgDaily = elapsedDays > 0 ? monthCo2 / elapsedDays : 0;
  const remainingDays = daysInMonth - elapsedDays;
  const predicted = Math.round((monthCo2 + avgDaily * remainingDays) * 10) / 10;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const monthDate = new Date();
    monthDate.setDate(1);
    const monthIso = monthDate.toISOString().slice(0, 10);
    const kg = parseFloat(budgetInput);
    if (isNaN(kg) || kg <= 0) {
      toast.error('Enter a valid budget');
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from('carbon_budgets')
      .upsert({ user_id: user.id, month: monthIso, budget_kg: kg }, { onConflict: 'user_id,month' });
    if (error) {
      toast.error('Failed to save budget');
    } else {
      toast.success('Budget updated');
      load();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Carbon Budget</h1>
        <p className="text-muted-foreground mt-1">Set a monthly carbon budget and track your usage.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Monthly Budget', value: `${budgetKg}`, suffix: 'kg CO₂', icon: Target, color: 'text-primary' },
          { label: 'Used This Month', value: `${Math.round(monthCo2 * 10) / 10}`, suffix: 'kg CO₂', icon: TrendingDown, color: 'text-chart-2' },
          { label: 'Remaining', value: `${remaining}`, suffix: 'kg CO₂', icon: Gauge, color: remaining > 0 ? 'text-chart-3' : 'text-destructive' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="glass rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div className="text-2xl font-bold">{c.value}<span className="text-sm font-normal text-muted-foreground ml-1">{c.suffix}</span></div>
              <div className="text-sm text-muted-foreground mt-0.5">{c.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Monthly Progress</h3>
                <p className="text-xs text-muted-foreground">Cumulative emissions vs. daily budget allowance</p>
              </div>
              <Badge variant={remaining > 0 ? 'default' : 'destructive'}>{usedPct}% used</Badge>
            </div>
            <Progress value={usedPct} className="h-2.5 mb-4" />
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(v: number, n: string) => [`${v} kg`, n === 'cumulative' ? 'Emissions' : 'Budget line']}
                />
                <Area type="monotone" dataKey="budget_line" stroke="hsl(var(--chart-3))" strokeWidth={1.5} strokeDasharray="5 5" fill="none" />
                <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#cumGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="glass rounded-2xl p-5 h-full flex flex-col">
            <h3 className="font-semibold mb-4">Set Budget</h3>
            <div className="space-y-1.5 mb-4">
              <Label htmlFor="budget">Monthly budget (kg CO₂)</Label>
              <Input
                id="budget"
                type="number"
                min="1"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Average person: ~300 kg/month. Eco-conscious: ~150 kg/month.
              </p>
            </div>
            <Button onClick={handleSave} className="w-full gap-2" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Budget
            </Button>

            <div className="mt-6 pt-6 border-t border-border/50">
              <h4 className="text-sm font-semibold mb-3">Prediction</h4>
              <div className="glass rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">Projected month-end emissions</div>
                <div className="text-2xl font-bold text-gradient">{predicted} kg</div>
                <div className="text-xs text-muted-foreground mt-2">
                  Based on {Math.round(avgDaily * 10) / 10} kg/day average · {remainingDays} days left
                </div>
                {predicted > budgetKg ? (
                  <p className="text-xs text-destructive mt-2">
                    You are projected to exceed your budget by {Math.round((predicted - budgetKg) * 10) / 10} kg.
                  </p>
                ) : (
                  <p className="text-xs text-primary mt-2">
                    On track — {Math.round((budgetKg - predicted) * 10) / 10} kg under budget.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
