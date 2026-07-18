'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sprout, Sword, Save, TreePine, Award, Calendar, Sun, Leaf,
  Flame, Star, Lock, Trophy, Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { BADGES } from '@/lib/badges';
import { xpToNextLevel, levelFromXp } from '@/lib/carbon-engine';
import type { Achievement, Activity } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const ICONS: Record<string, React.ElementType> = {
  Sprout, Sword, Save, TreePine, Award, Calendar, Sun, Leaf,
};

const TIER_STYLES: Record<string, { border: string; glow: string; label: string }> = {
  bronze: { border: 'border-orange-500/30', glow: 'shadow-[0_0_20px_-5px_rgba(180,83,9,0.4)]', label: 'Bronze' },
  silver: { border: 'border-slate-400/30', glow: 'shadow-[0_0_20px_-5px_rgba(148,163,184,0.4)]', label: 'Silver' },
  gold: { border: 'border-yellow-500/40', glow: 'shadow-[0_0_24px_-4px_rgba(234,179,8,0.5)]', label: 'Gold' },
  platinum: { border: 'border-cyan-400/40', glow: 'shadow-[0_0_28px_-4px_rgba(34,211,238,0.5)]', label: 'Platinum' },
};

export default function AchievementsPage() {
  const { user, profile } = useAuth();
  const [earned, setEarned] = useState<Achievement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const [achRes, actRes] = await Promise.all([
      supabase.from('achievements').select('*').eq('user_id', user.id),
      supabase.from('activities').select('*').eq('user_id', user.id),
    ]);
    setEarned((achRes.data ?? []) as Achievement[]);
    setActivities((actRes.data ?? []) as Activity[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const earnedKeys = new Set(earned.map((a) => a.badge_key));
  const totalXp = profile?.total_xp ?? 0;
  const level = profile?.level ?? levelFromXp(totalXp);
  const xpInfo = xpToNextLevel(totalXp);
  const streak = profile?.current_streak ?? 0;
  const longest = profile?.longest_streak ?? 0;

  // Progress toward each badge (approximate)
  const getProgress = (badgeKey: string): number => {
    if (earnedKeys.has(badgeKey)) return 100;
    const b = BADGES.find((x) => x.key === badgeKey);
    if (!b) return 0;
    switch (badgeKey) {
      case 'green_starter':
        return activities.length >= 1 ? 100 : 0;
      case 'eco_warrior':
        return Math.min(100, Math.round((activities.length / 25) * 100));
      case 'carbon_saver': {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthCo2 = activities.filter((a) => new Date(a.date) >= monthStart).reduce((s, a) => s + a.co2_kg, 0);
        return Math.min(100, Math.round((monthCo2 / 50) * 100));
      }
      case 'tree_protector':
        return Math.min(100, Math.round((streak / 7) * 100));
      case 'climate_hero':
        return Math.min(100, Math.round(((profile?.sustainability_index ?? 0) / 90) * 100));
      case 'month_master':
        return Math.min(100, Math.round((activities.length / 30) * 100));
      case 'renewable_advocate':
        return Math.min(100, Math.round((activities.filter((a) => a.type === 'renewable').length / 10) * 100));
      case 'plant_based':
        return Math.min(100, Math.round((activities.filter((a) => a.type === 'vegan' || a.type === 'vegetarian').length / 20) * 100));
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground mt-1">Earn badges, build streaks, and level up your sustainability game.</p>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Level', value: level, icon: Star, color: 'text-chart-3' },
          { label: 'Total XP', value: totalXp, icon: Zap, color: 'text-primary' },
          { label: 'Current Streak', value: `${streak} days`, icon: Flame, color: 'text-chart-4' },
          { label: 'Longest Streak', value: `${longest} days`, icon: Trophy, color: 'text-chart-2' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="glass rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Level progress */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Level {level} Progress</h3>
            <BadgeUI variant="secondary">{xpInfo.current} / {xpInfo.needed} XP</BadgeUI>
          </div>
          <Progress value={xpInfo.percent} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {xpInfo.needed - xpInfo.current} XP until level {level + 1}
          </p>
        </Card>
      </motion.div>

      {/* Badges grid */}
      <div>
        <h3 className="font-semibold mb-3">Badges</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BADGES.map((b, i) => {
            const Icon = ICONS[b.icon] ?? Award;
            const isEarned = earnedKeys.has(b.key);
            const progress = getProgress(b.key);
            const tier = TIER_STYLES[b.tier];
            return (
              <motion.div
                key={b.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={cn(
                    'glass rounded-2xl p-5 relative overflow-hidden transition-all',
                    isEarned ? `${tier.border} ${tier.glow}` : 'opacity-70'
                  )}
                >
                  {isEarned && (
                    <div className="absolute top-3 right-3">
                      <BadgeUI variant="secondary" className="text-xs bg-primary/15 text-primary border-primary/30">
                        Earned
                      </BadgeUI>
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={cn(
                        'w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-transform',
                        isEarned ? 'bg-primary/15 scale-100' : 'bg-muted grayscale'
                      )}
                    >
                      {isEarned ? (
                        <Icon className="w-8 h-8 text-primary" />
                      ) : (
                        <Lock className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>
                    <h4 className="font-semibold text-sm">{b.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{b.description}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-chart-3 font-medium">
                      <Zap className="w-3 h-3" /> {b.xp} XP
                    </div>
                    <BadgeUI variant="outline" className="text-xs mt-2 capitalize">{tier.label}</BadgeUI>
                    {!isEarned && progress > 0 && (
                      <div className="w-full mt-3">
                        <Progress value={progress} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
