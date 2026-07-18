'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, MapPin, FileText, Save, Loader2, Target, Plus,
  Trash2, Check, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Goal, GoalStatus } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('transport');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setLocation(profile.location ?? '');
      setBio(profile.bio ?? '');
    }
  }, [profile]);

  const loadGoals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setGoals((data ?? []) as Goal[]);
    setLoadingGoals(false);
  }, [user]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: displayName,
      location,
      bio,
    }).eq('id', user.id);
    if (error) {
      toast.error('Failed to save profile');
    } else {
      toast.success('Profile updated');
      refreshProfile();
    }
    setSaving(false);
  };

  const handleAddGoal = async () => {
    if (!user || !newGoalTitle || !newGoalTarget) return;
    const target = parseFloat(newGoalTarget);
    if (isNaN(target) || target <= 0) {
      toast.error('Enter a valid target');
      return;
    }
    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      title: newGoalTitle,
      category: newGoalCategory,
      target_value: target,
      unit: 'kg CO₂',
    });
    if (error) {
      toast.error('Failed to add goal');
      return;
    }
    toast.success('Goal added');
    setNewGoalTitle('');
    setNewGoalTarget('');
    loadGoals();
  };

  const handleGoalStatus = async (id: string, status: GoalStatus) => {
    await supabase.from('goals').update({ status }).eq('id', id);
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)));
    toast.success(status === 'completed' ? 'Goal completed' : 'Goal abandoned');
  };

  const handleDeleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    toast.success('Goal deleted');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and sustainability goals.</p>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="glass rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Profile</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Display name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10" placeholder="Your name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="pl-10" placeholder="City, Country" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5 mt-4">
            <Label htmlFor="bio">Bio</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="pl-10" rows={3} placeholder="Tell us about your sustainability journey..." />
            </div>
          </div>
          <Button onClick={handleSaveProfile} className="mt-4 gap-2" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </Button>
        </Card>
      </motion.div>

      {/* Goals */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <Card className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Sustainability Goals</h3>
          </div>

          {/* Add goal */}
          <div className="grid gap-3 md:grid-cols-4 mb-4">
            <Input placeholder="Goal title" value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} />
            <select
              value={newGoalCategory}
              onChange={(e) => setNewGoalCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="transport">Transport</option>
              <option value="food">Food</option>
              <option value="energy">Energy</option>
              <option value="water">Water</option>
              <option value="waste">Waste</option>
              <option value="general">General</option>
            </select>
            <Input placeholder="Target (kg CO₂)" type="number" value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value)} />
            <Button onClick={handleAddGoal} className="gap-2">
              <Plus className="w-4 h-4" /> Add Goal
            </Button>
          </div>

          {loadingGoals ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : goals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No goals yet. Set your first sustainability goal above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {goals.map((g) => {
                  const pct = Math.min(100, Math.round((g.current_value / g.target_value) * 100));
                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-3 p-4 rounded-xl border border-border/50 glass hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{g.title}</span>
                          <Badge variant="outline" className="text-xs capitalize">{g.category}</Badge>
                          {g.status !== 'active' && (
                            <Badge className={g.status === 'completed' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}>
                              {g.status}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {g.current_value} / {g.target_value} {g.unit} ({pct}%)
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      {g.status === 'active' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleGoalStatus(g.id, 'completed')} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleGoalStatus(g.id, 'abandoned')} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <button onClick={() => handleDeleteGoal(g.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
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
  );
}
