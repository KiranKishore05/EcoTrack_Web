import { supabase } from './supabase';
import type { Profile } from './types';

export const XP_REWARDS = {
  LOG_ACTIVITY: 15,
  RECYCLE: 25,
  WALK_INSTEAD_OF_DRIVE: 50,
  COMPLETE_GOAL: 100,
};

export const BADGES = [
  { key: 'bronze', name: 'Bronze Badge', description: 'Log 5 activities', icon: 'medal', threshold: 5, color: 'text-orange-400' },
  { key: 'silver', name: 'Silver Badge', description: 'Log 25 activities', icon: 'medal', threshold: 25, color: 'text-gray-300' },
  { key: 'gold', name: 'Gold Badge', description: 'Log 50 activities', icon: 'medal', threshold: 50, color: 'text-yellow-400' },
  { key: 'earth_hero', name: 'Earth Hero', description: 'Reach Level 10', icon: 'globe', threshold: 10, color: 'text-blue-500' },
  { key: 'eco_warrior', name: 'Eco Warrior', description: 'Achieve a 7-day streak', icon: 'leaf', threshold: 7, color: 'text-green-500' },
];

export async function awardActivityXP(
  userId: string,
  profile: Profile | null,
  dateStr: string,
  activityType: string,
  category: string
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

  // Calculate XP based on activity type
  let earnedXp = XP_REWARDS.LOG_ACTIVITY; // Base XP
  
  if (category === 'waste') { // Assumes 'waste' means recycling for this simple logic
    earnedXp += XP_REWARDS.RECYCLE;
  }
  if (activityType === 'walking') {
    earnedXp += XP_REWARDS.WALK_INSTEAD_OF_DRIVE;
  }

  const newXp = (profile?.total_xp ?? 0) + earnedXp;

  // Evaluate Level for Earth Hero
  const level = Math.floor(Math.sqrt(newXp / 50)) + 1;

  // Check Badges
  await evaluateBadges(userId, newStreak, level);

  // Update Profile
  await supabase.from('profiles').upsert(
    {
      id: userId,
      current_streak: newStreak,
      longest_streak: longest,
      last_activity_date: dateStr,
      total_xp: newXp,
      level: level,
    },
    { onConflict: 'id' }
  );

  return earnedXp;
}

export async function awardGoalXP(userId: string, profile: Profile | null) {
  const newXp = (profile?.total_xp ?? 0) + XP_REWARDS.COMPLETE_GOAL;
  const level = Math.floor(Math.sqrt(newXp / 50)) + 1;
  
  await supabase.from('profiles').update({
    total_xp: newXp,
    level: level
  }).eq('id', userId);

  await evaluateBadges(userId, profile?.current_streak ?? 0, level);
  
  return XP_REWARDS.COMPLETE_GOAL;
}

async function evaluateBadges(userId: string, currentStreak: number, level: number) {
  // Count total activities
  const { count } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
    
  const totalActivities = count ?? 0;

  // Fetch currently earned badges
  const { data: earned } = await supabase
    .from('achievements')
    .select('badge_key')
    .eq('user_id', userId);
    
  const earnedKeys = new Set((earned ?? []).map(a => a.badge_key));

  const toAward = [];
  
  for (const badge of BADGES) {
    if (earnedKeys.has(badge.key)) continue;

    let unlocked = false;
    if (badge.key === 'bronze' && totalActivities >= badge.threshold) unlocked = true;
    if (badge.key === 'silver' && totalActivities >= badge.threshold) unlocked = true;
    if (badge.key === 'gold' && totalActivities >= badge.threshold) unlocked = true;
    if (badge.key === 'earth_hero' && level >= badge.threshold) unlocked = true;
    if (badge.key === 'eco_warrior' && currentStreak >= badge.threshold) unlocked = true;

    if (unlocked) {
      toAward.push({
        user_id: userId,
        badge_key: badge.key,
        earned_at: new Date().toISOString()
      });
    }
  }

  if (toAward.length > 0) {
    await supabase.from('achievements').insert(toAward);
  }
}
