export type Category = 'transport' | 'food' | 'energy' | 'water' | 'waste';

export type ActivityType =
  | 'car' | 'bus' | 'bike' | 'train' | 'flight' | 'walking'
  | 'vegetarian' | 'non_vegetarian' | 'vegan' | 'dairy'
  | 'electricity' | 'lpg' | 'water' | 'renewable';

export interface Activity {
  id: string;
  user_id: string;
  date: string;
  category: Category;
  type: ActivityType;
  value: number;
  unit: string;
  co2_kg: number;
  notes?: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  sustainability_index: number;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CarbonBudget {
  id: string;
  user_id: string;
  month: string;
  budget_kg: number;
  created_at: string;
  updated_at: string;
}

export type RecommendationStatus = 'pending' | 'applied' | 'dismissed';
export type Priority = 'low' | 'medium' | 'high';

export interface Recommendation {
  id: string;
  user_id: string;
  category: string;
  priority: Priority;
  title: string;
  description: string;
  estimated_savings_kg: number;
  status: RecommendationStatus;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type GoalStatus = 'active' | 'completed' | 'abandoned';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_key: string;
  earned_at: string;
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface Report {
  id: string;
  user_id: string;
  period: ReportPeriod;
  start_date: string;
  end_date: string;
  summary: string;
  impact_score: number;
  total_co2_kg: number;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface AIRecommendationResult {
  summary: string;
  recommendations: Array<{
    category: string;
    priority: Priority;
    title: string;
    description: string;
    estimated_savings_kg: number;
  }>;
  impact_score: string;
  weekly_goals: Array<{
    title: string;
    description: string;
    target: string;
  }>;
}

export interface Badge {
  key: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  xp: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface CategoryBreakdown {
  category: Category;
  co2_kg: number;
  percentage: number;
  count: number;
}

export interface DashboardStats {
  totalCo2: number;
  dailyAverage: number;
  categoryBreakdown: CategoryBreakdown[];
  trend: Array<{ date: string; co2_kg: number }>;
  budgetUsed: number;
  budgetRemaining: number;
  sustainabilityIndex: number;
  streak: number;
  level: number;
  totalXp: number;
  heatmapData: Array<{ date: string; count: number; level: number }>;
}
