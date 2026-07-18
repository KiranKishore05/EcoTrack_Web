import type { Activity, ActivityType, Category, CategoryBreakdown } from './types';

/**
 * Emission factors in kg CO2 per unit.
 * Sources: UK DEFRA / EPA typical conversion factors (simplified for app use).
 */
export const EMISSION_FACTORS: Record<ActivityType, number> = {
  // transport: kg CO2 per km
  car: 0.192,
  bus: 0.105,
  bike: 0.06,
  train: 0.041,
  flight: 0.255,
  walking: 0,
  // food: kg CO2 per meal
  vegetarian: 1.7,
  non_vegetarian: 5.0,
  vegan: 1.2,
  dairy: 3.2,
  // energy: kg CO2 per kWh / per unit
  electricity: 0.4,
  lpg: 1.5,
  water: 0.15,
  renewable: 0,
};

export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; category: Category; unit: string; icon: string }
> = {
  car: { label: 'Car', category: 'transport', unit: 'km', icon: 'Car' },
  bus: { label: 'Bus', category: 'transport', unit: 'km', icon: 'Bus' },
  bike: { label: 'Motorbike', category: 'transport', unit: 'km', icon: 'Bike' },
  train: { label: 'Train', category: 'transport', unit: 'km', icon: 'TrainFront' },
  flight: { label: 'Flight', category: 'transport', unit: 'km', icon: 'Plane' },
  walking: { label: 'Walking', category: 'transport', unit: 'km', icon: 'Footprints' },
  vegetarian: { label: 'Vegetarian Meal', category: 'food', unit: 'meal', icon: 'Salad' },
  non_vegetarian: { label: 'Non-Veg Meal', category: 'food', unit: 'meal', icon: 'Beef' },
  vegan: { label: 'Vegan Meal', category: 'food', unit: 'meal', icon: 'Leaf' },
  dairy: { label: 'Dairy Meal', category: 'food', unit: 'meal', icon: 'Milk' },
  electricity: { label: 'Electricity', category: 'energy', unit: 'kWh', icon: 'Zap' },
  lpg: { label: 'LPG', category: 'energy', unit: 'kg', icon: 'Flame' },
  water: { label: 'Water', category: 'water', unit: 'L', icon: 'Droplets' },
  renewable: { label: 'Renewable Energy', category: 'energy', unit: 'kWh', icon: 'Sun' },
};

export function calculateEmission(type: ActivityType, value: number): number {
  const factor = EMISSION_FACTORS[type] ?? 0;
  return Math.round(factor * value * 1000) / 1000;
}

export function buildActivityInput(
  type: ActivityType,
  value: number,
  date: string,
  notes?: string
): Omit<Activity, 'id' | 'user_id' | 'created_at'> {
  return {
    date,
    category: ACTIVITY_META[type].category,
    type,
    value,
    unit: ACTIVITY_META[type].unit,
    co2_kg: calculateEmission(type, value),
    notes: notes ?? null,
  };
}

export function computeCategoryBreakdown(activities: Activity[]): CategoryBreakdown[] {
  const totals: Record<string, { co2_kg: number; count: number }> = {};
  let grandTotal = 0;

  for (const a of activities) {
    if (!totals[a.category]) totals[a.category] = { co2_kg: 0, count: 0 };
    totals[a.category].co2_kg += a.co2_kg;
    totals[a.category].count += 1;
    grandTotal += a.co2_kg;
  }

  const categories: Category[] = ['transport', 'food', 'energy', 'water', 'waste'];
  return categories
    .filter((c) => totals[c])
    .map((c) => ({
      category: c,
      co2_kg: Math.round(totals[c].co2_kg * 1000) / 1000,
      percentage: grandTotal > 0 ? Math.round((totals[c].co2_kg / grandTotal) * 100) : 0,
      count: totals[c].count,
    }));
}

export function computeTrend(activities: Activity[], days = 14) {
  const map = new Map<string, number>();
  for (const a of activities) {
    map.set(a.date, (map.get(a.date) ?? 0) + a.co2_kg);
  }
  const result: Array<{ date: string; co2_kg: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    result.push({ date: iso, co2_kg: Math.round((map.get(iso) ?? 0) * 1000) / 1000 });
  }
  return result;
}

export function computeSustainabilityIndex(activities: Activity[], budget: number): number {
  if (activities.length === 0) return 50;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCo2 = activities
    .filter((a) => new Date(a.date) >= monthStart)
    .reduce((sum, a) => sum + a.co2_kg, 0);
  if (budget <= 0) return 50;
  const ratio = monthCo2 / budget;
  const index = Math.max(0, Math.min(100, Math.round(100 - ratio * 50)));
  return index;
}

export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 50;
}

export function xpToNextLevel(xp: number): { current: number; needed: number; percent: number } {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const needed = next - base;
  const current = xp - base;
  return { current, needed, percent: Math.min(100, Math.round((current / needed) * 100)) };
}
