import { supabase } from './supabase';
import {
    computeSustainabilityIndex,
    xpToNextLevel,
} from './carbon-engine';

export interface DashboardStats {
    activityCount: number;
    totalCO2: number;
    achievementCount: number;
    budgetKg: number;
    sustainabilityIndex: number;
    level: number;
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    xpProgress: {
        current: number;
        needed: number;
        percent: number;
    };
    recentActivities: any[];
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
    // Load profile
    const { data: profile } = await supabase
        .from('profiles')
        .select(
            'level,total_xp,current_streak,longest_streak'
        )
        .eq('id', userId)
        .single();

    // Load activities
    const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    // Load achievements count
    const { count: achievementCount } = await supabase
        .from('achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    const { data: budget } = await supabase
        .from('carbon_budgets')
        .select('budget_kg')
        .eq('user_id', userId)
        .maybeSingle();

    const totalCO2 =
        activities?.reduce(
            (sum, item) => sum + Number(item.co2_kg ?? 0),
            0
        ) ?? 0;

    const sustainabilityIndex = computeSustainabilityIndex(
        activities ?? [],
        budget?.budget_kg ?? 100
    );

    const xpProgress = xpToNextLevel(profile?.total_xp ?? 0);

    return {
        activityCount: activities?.length ?? 0,
        totalCO2,

        achievementCount: achievementCount ?? 0,

        budgetKg: budget?.budget_kg ?? 0,

        sustainabilityIndex,

        level: profile?.level ?? 1,

        totalXp: profile?.total_xp ?? 0,

        currentStreak: profile?.current_streak ?? 0,

        longestStreak: profile?.longest_streak ?? 0,

        xpProgress,

        recentActivities: activities?.slice(0, 5) ?? [],
    };
}