'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Bus, Bike, TrainFront, Plane, Footprints,
  Salad, Beef, Leaf, Milk, Zap, Flame, Droplets, Sun,
  Plus, Trash2, Calendar, Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import {
  ACTIVITY_META, buildActivityInput, calculateEmission,
} from '@/lib/carbon-engine';
import type { Activity, ActivityType, Category } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ICONS: Record<string, React.ElementType> = {
  Car, Bus, Bike, TrainFront, Plane, Footprints,
  Salad, Beef, Leaf, Milk, Zap, Flame, Droplets, Sun,
};

const CATEGORIES: { key: Category; label: string; types: ActivityType[] }[] = [
  {
    key: 'transport',
    label: 'Transport',
    types: ['car', 'bus', 'bike', 'train', 'flight', 'walking'],
  },
  {
    key: 'food',
    label: 'Food',
    types: ['vegetarian', 'non_vegetarian', 'vegan', 'dairy'],
  },
  {
    key: 'energy',
    label: 'Energy',
    types: ['electricity', 'lpg', 'renewable'],
  },
  {
    key: 'water',
    label: 'Water',
    types: ['water'],
  },
];

export default function ActivitiesPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ActivityType>('car');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    setActivities((data ?? []) as Activity[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const meta = ACTIVITY_META[selectedType];
  const previewCo2 = value ? calculateEmission(selectedType, parseFloat(value)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !value) return;
    setSubmitting(true);
    const input = buildActivityInput(selectedType, parseFloat(value), date, notes || undefined);
    const { error } = await supabase.from('activities').insert({
      ...input,
      user_id: user.id,
    });

    if (error) {
      toast.error('Failed to log activity: ' + error.message);
      setSubmitting(false);
      return;
    }

    // Update streak + XP
    await updateStreakAndXp(user.id, profile, date, refreshProfile);

    toast.success(`Activity logged — ${input.co2_kg} kg CO₂`);
    setValue('');
    setNotes('');
    setSubmitting(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete activity');
      return;
    }
    setActivities((prev) => prev.filter((a) => a.id !== id));
    toast.success('Activity deleted');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Activities</h1>
        <p className="text-muted-foreground mt-1">Log your daily habits to track your carbon footprint.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Logging form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="glass rounded-2xl p-5">
            <h3 className="font-semibold mb-4">Log an Activity</h3>
            <Tabs defaultValue="transport">
              <TabsList className="grid grid-cols-4 w-full mb-4">
                {CATEGORIES.map((c) => (
                  <TabsTrigger key={c.key} value={c.key} className="text-xs">
                    {c.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {CATEGORIES.map((c) => (
                <TabsContent key={c.key} value={c.key} className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {c.types.map((t) => {
                      const Icon = ICONS[ACTIVITY_META[t].icon] ?? Plus;
                      const active = selectedType === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedType(t)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                            active
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{ACTIVITY_META[t].label}</span>
                        </button>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="value">
                  {meta.label} ({meta.unit})
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder={`Enter ${meta.unit}`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {value && (
                <div className="glass rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estimated CO₂</span>
                  <span className="text-lg font-bold text-primary">{previewCo2} kg</span>
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={submitting || !value}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Logging...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Log Activity
                  </>
                )}
              </Button>
            </form>
          </Card>
        </motion.div>

        {/* History */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-3"
        >
          <Card className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Activity</h3>
              <Badge variant="secondary">{activities.length} logged</Badge>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activities yet. Log your first one!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {activities.map((a, i) => {
                    const Icon = ICONS[ACTIVITY_META[a.type].icon] ?? Plus;
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2, delay: i * 0.02 }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{ACTIVITY_META[a.type].label}</span>
                            <span className="text-xs text-muted-foreground">
                              {a.value} {a.unit}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(a.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            {a.notes ? ` · ${a.notes}` : ''}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-primary border-primary/30">
                          {a.co2_kg} kg
                        </Badge>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

async function updateStreakAndXp(
  userId: string,
  profile: { current_streak: number; longest_streak: number; last_activity_date: string | null; total_xp: number } | null,
  dateStr: string,
  refresh: () => Promise<void>
) {
  const today = new Date(dateStr);
  const last = profile?.last_activity_date ? new Date(profile.last_activity_date) : null;
  let newStreak = 1;
  if (last) {
    const diff = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) newStreak = (profile?.current_streak ?? 0) + 1;
    else if (diff === 0) newStreak = profile?.current_streak ?? 1;
    else newStreak = 1;
  }
  const longest = Math.max(newStreak, profile?.longest_streak ?? 0);
  const newXp = (profile?.total_xp ?? 0) + 15;

  await supabase.from('profiles').upsert(
    {
      id: userId,
      current_streak: newStreak,
      longest_streak: longest,
      last_activity_date: dateStr,
      total_xp: newXp,
    },
    { onConflict: 'id' }
  );

  await refresh();
}
