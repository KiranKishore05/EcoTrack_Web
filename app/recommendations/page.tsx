'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, Check, X, Loader2, Target, TrendingDown,
  Zap, Car, Utensils, Droplets, Leaf, Gauge,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { generateRecommendations } from '@/lib/ai-engine';
import { computeCategoryBreakdown, computeSustainabilityIndex } from '@/lib/carbon-engine';
import type { Activity, Goal, Recommendation, RecommendationStatus } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-destructive/15 text-destructive border-destructive/30',
  medium: 'bg-chart-3/15 text-chart-3 border-chart-3/30',
  low: 'bg-primary/15 text-primary border-primary/30',
};

const CAT_ICONS: Record<string, React.ElementType> = {
  transport: Car,
  food: Utensils,
  energy: Zap,
  water: Droplets,
  general: Leaf,
  budget: Gauge,
};

export default function RecommendationsPage() {
  const { user, profile } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [saved, setSaved] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof generateRecommendations> | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [actRes, goalRes, recRes] = await Promise.all([
      supabase.from('activities').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(200),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('recommendations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setActivities((actRes.data ?? []) as Activity[]);
    setGoals((goalRes.data ?? []) as Goal[]);
    setSaved((recRes.data ?? []) as Recommendation[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate AI latency
    const breakdown = computeCategoryBreakdown(activities);
    const budget = 300;
    const sustainabilityIndex = profile?.sustainability_index ?? computeSustainabilityIndex(activities, budget);
    const res = generateRecommendations({
      activities,
      goals,
      budget,
      sustainabilityIndex,
      streak: profile?.current_streak ?? 0,
    });
    setResult(res);
    setGenerating(false);
  };

  const handleSave = async (rec: typeof result extends null ? never : NonNullable<typeof result>['recommendations'][number]) => {
    if (!user) return;
    const { error } = await supabase.from('recommendations').insert({
      user_id: user.id,
      category: rec.category,
      priority: rec.priority,
      title: rec.title,
      description: rec.description,
      estimated_savings_kg: rec.estimated_savings_kg,
      status: 'pending',
      payload: {},
    });
    if (error) {
      toast.error('Failed to save recommendation');
      return;
    }
    toast.success('Recommendation saved');
    load();
  };

  const handleStatusChange = async (id: string, status: RecommendationStatus) => {
    const { error } = await supabase.from('recommendations').update({ status }).eq('id', id);
    if (error) {
      toast.error('Update failed');
      return;
    }
    setSaved((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(status === 'applied' ? 'Marked as applied' : 'Dismissed');
  };

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
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-muted-foreground mt-1">Personalized eco recommendations powered by AI analysis of your habits.</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating} className="gap-2">
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Generate Insights
            </>
          )}
        </Button>
      </div>

      {/* AI Result */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Summary */}
            <Card className="glass-strong rounded-2xl p-5 glow-primary">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">AI Analysis Summary</h3>
                    <Badge variant="secondary" className="text-xs">Impact: {result.impact_score}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                </div>
              </div>
            </Card>

            {/* Recommendations */}
            <div className="grid gap-3 md:grid-cols-2">
              {result.recommendations.map((rec, i) => {
                const Icon = CAT_ICONS[rec.category] ?? Leaf;
                return (
                  <motion.div
                    key={rec.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="glass rounded-2xl p-4 h-full flex flex-col">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{rec.title}</h4>
                          <Badge className={cn('text-xs mt-1 border', PRIORITY_STYLES[rec.priority])}>
                            {rec.priority}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground flex-1 leading-relaxed">{rec.description}</p>
                      {rec.estimated_savings_kg > 0 && (
                        <div className="flex items-center gap-1.5 mt-3 text-xs text-primary">
                          <TrendingDown className="w-3.5 h-3.5" />
                          Save {rec.estimated_savings_kg} kg CO₂
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3 gap-1.5"
                        onClick={() => handleSave(rec)}
                      >
                        <Check className="w-3.5 h-3.5" /> Save
                      </Button>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Weekly goals */}
            <Card className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Personalized Weekly Challenges</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {result.weekly_goals.map((g, i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <div className="text-xs text-primary font-medium mb-1">{g.target}</div>
                    <h4 className="font-medium text-sm mb-1">{g.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{g.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved recommendations */}
      <div>
        <h3 className="font-semibold mb-3">Saved Recommendations</h3>
        {saved.length === 0 ? (
          <Card className="glass rounded-2xl p-10 text-center">
            <Brain className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              No saved recommendations yet. Generate insights and save the ones you want to act on.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {saved.map((r) => {
              const Icon = CAT_ICONS[r.category] ?? Leaf;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border/50 glass hover:bg-muted/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{r.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>
                  </div>
                  {r.estimated_savings_kg > 0 && (
                    <Badge variant="outline" className="text-primary border-primary/30 hidden sm:inline">
                      -{r.estimated_savings_kg} kg
                    </Badge>
                  )}
                  <Badge
                    className={cn(
                      'text-xs',
                      r.status === 'applied' && 'bg-primary/15 text-primary border-primary/30',
                      r.status === 'dismissed' && 'bg-muted text-muted-foreground',
                      r.status === 'pending' && 'bg-chart-3/15 text-chart-3 border-chart-3/30'
                    )}
                  >
                    {r.status}
                  </Badge>
                  {r.status === 'pending' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleStatusChange(r.id, 'applied')}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(r.id, 'dismissed')}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
