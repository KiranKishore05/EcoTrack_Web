import type { Activity, AIRecommendationResult, Goal, Priority } from './types';
import { computeCategoryBreakdown, EMISSION_FACTORS } from './carbon-engine';

interface AnalysisContext {
  activities: Activity[];
  goals: Goal[];
  budget: number;
  sustainabilityIndex: number;
  streak: number;
}

interface RecTemplate {
  category: string;
  priority: Priority;
  title: string;
  description: string;
  estimated_savings_kg: number;
}

/**
 * Rule-based sustainability recommendation engine.
 * Analyzes user activities, emission trends, and goals to generate
 * personalized eco suggestions, carbon reduction strategies, and weekly challenges.
 * Returns structured JSON matching the AI workflow contract.
 */
export function generateRecommendations(ctx: AnalysisContext): AIRecommendationResult {
  const { activities, goals, budget, sustainabilityIndex, streak } = ctx;
  const breakdown = computeCategoryBreakdown(activities);
  const recs: RecTemplate[] = [];

  const byCategory = (cat: string) => breakdown.find((b) => b.category === cat)?.co2_kg ?? 0;
  const transportCo2 = byCategory('transport');
  const foodCo2 = byCategory('food');
  const energyCo2 = byCategory('energy');
  const waterCo2 = byCategory('water');

  // Transport analysis
  const carActivities = activities.filter((a) => a.type === 'car');
  if (carActivities.length > 0 && transportCo2 > 5) {
    const carKm = carActivities.reduce((s, a) => s + a.value, 0);
    const savings = Math.round((carKm * 0.087) * 10) / 10; // switching car->bus
    recs.push({
      category: 'transport',
      priority: 'high',
      title: 'Switch car trips to public transit',
      description: `You drove ${Math.round(carKm)} km recently. Replacing half those trips with bus travel could save ${savings} kg CO2.`,
      estimated_savings_kg: savings,
    });
  }

  const flightActivities = activities.filter((a) => a.type === 'flight');
  if (flightActivities.length > 0) {
    recs.push({
      category: 'transport',
      priority: 'high',
      title: 'Consider train alternatives for short flights',
      description: 'Short-haul flights have high per-km emissions. Train travel produces 84% less CO2 per passenger-km.',
      estimated_savings_kg: Math.round(flightActivities.reduce((s, a) => s + a.co2_kg, 0) * 0.84 * 10) / 10,
    });
  }

  // Food analysis
  const nonVeg = activities.filter((a) => a.type === 'non_vegetarian').length;
  const veg = activities.filter((a) => a.type === 'vegetarian' || a.type === 'vegan').length;
  if (nonVeg > veg) {
    const savings = Math.round(nonVeg * 3.3 * 10) / 10;
    recs.push({
      category: 'food',
      priority: 'medium',
      title: 'Reduce red meat consumption',
      description: `You logged ${nonVeg} non-vegetarian meals vs ${veg} plant-based. Swapping half to plant-based saves ${savings} kg CO2.`,
      estimated_savings_kg: savings,
    });
  }

  if (veg >= 5) {
    recs.push({
      category: 'food',
      priority: 'low',
      title: 'Keep up the plant-based meals',
      description: `Great work! ${veg} plant-based meals logged. Each saves ~3.3 kg CO2 vs red meat.`,
      estimated_savings_kg: 0,
    });
  }

  // Energy analysis
  const elecActivities = activities.filter((a) => a.type === 'electricity');
  if (elecActivities.length > 0) {
    const totalKwh = elecActivities.reduce((s, a) => s + a.value, 0);
    if (totalKwh > 100) {
      recs.push({
        category: 'energy',
        priority: 'high',
        title: 'Switch to LED bulbs and efficient appliances',
        description: `Your electricity usage (${Math.round(totalKwh)} kWh) is high. LEDs use 75% less energy — potential savings of ${Math.round(totalKwh * 0.4 * 0.3 * 10) / 10} kg CO2.`,
        estimated_savings_kg: Math.round(totalKwh * 0.4 * 0.3 * 10) / 10,
      });
    }
    const renewable = activities.filter((a) => a.type === 'renewable').length;
    if (renewable === 0 && totalKwh > 50) {
      recs.push({
        category: 'energy',
        priority: 'medium',
        title: 'Consider renewable energy sourcing',
        description: 'Switching to a green energy provider can cut your electricity emissions to near zero.',
        estimated_savings_kg: Math.round(totalKwh * 0.4 * 10) / 10,
      });
    }
  }

  // Water analysis
  const waterActivities = activities.filter((a) => a.type === 'water');
  if (waterActivities.length > 0) {
    const totalL = waterActivities.reduce((s, a) => s + a.value, 0);
    if (totalL > 200) {
      recs.push({
        category: 'water',
        priority: 'medium',
        title: 'Install low-flow fixtures',
        description: `You used ${Math.round(totalL)} L of water. Low-flow showerheads and faucets can cut usage by 30%.`,
        estimated_savings_kg: Math.round(totalL * 0.15 * 0.3 * 10) / 10,
      });
    }
  }

  // Streak-based
  if (streak >= 7) {
    recs.push({
      category: 'general',
      priority: 'low',
      title: `Maintain your ${streak}-day streak`,
      description: 'Consistent tracking leads to lasting change. You are building a powerful habit.',
      estimated_savings_kg: 0,
    });
  } else if (streak < 3) {
    recs.push({
      category: 'general',
      priority: 'low',
      title: 'Build a daily logging habit',
      description: 'Log at least one activity daily to build momentum and unlock streak badges.',
      estimated_savings_kg: 0,
    });
  }

  // Budget-based
  const monthCo2 = activities
    .filter((a) => {
      const d = new Date(a.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, a) => s + a.co2_kg, 0);

  if (budget > 0 && monthCo2 > budget * 0.8) {
    recs.push({
      category: 'budget',
      priority: 'high',
      title: 'You are approaching your monthly carbon budget',
      description: `You have used ${Math.round(monthCo2)} of ${budget} kg CO2 (${Math.round((monthCo2 / budget) * 100)}%). Focus on your highest-emission category to stay on track.`,
      estimated_savings_kg: Math.round((monthCo2 - budget * 0.8) * 10) / 10,
    });
  }

  // Dedupe by title
  const seen = new Set<string>();
  const unique = recs.filter((r) => {
    if (seen.has(r.title)) return false;
    seen.add(r.title);
    return true;
  });

  // Weekly goals
  const topCategory = breakdown.sort((a, b) => b.co2_kg - a.co2_kg)[0];
  const weekly_goals: AIRecommendationResult['weekly_goals'] = [];

  if (topCategory) {
    weekly_goals.push({
      title: `Reduce ${topCategory.category} emissions by 15%`,
      description: `Your top emission source is ${topCategory.category} (${topCategory.co2_kg} kg). Target a 15% cut this week.`,
      target: `${Math.round(topCategory.co2_kg * 0.15 * 10) / 10} kg CO2`,
    });
  }

  weekly_goals.push({
    title: 'Log at least one activity every day',
    description: 'Maintain your tracking streak to build sustainable habits.',
    target: '7 days',
  });

  if (goals.filter((g) => g.status === 'active').length === 0) {
    weekly_goals.push({
      title: 'Set a personal sustainability goal',
      description: 'Define a measurable target to stay motivated and track progress.',
      target: '1 goal',
    });
  }

  // Summary
  const totalCo2 = activities.reduce((s, a) => s + a.co2_kg, 0);
  const topCat = breakdown.sort((a, b) => b.co2_kg - a.co2_kg)[0];
  const summary = [
    `You logged ${activities.length} activities producing ${Math.round(totalCo2 * 10) / 10} kg CO2.`,
    topCat ? `Your largest emission source is ${topCat.category} (${topCat.percentage}%).` : '',
    `Your sustainability index is ${sustainabilityIndex}/100.`,
    sustainabilityIndex >= 75 ? 'Excellent progress toward your climate goals.' : 'There is meaningful room for improvement.',
  ].filter(Boolean).join(' ');

  return {
    summary,
    recommendations: unique.slice(0, 8),
    impact_score: `${sustainabilityIndex}/100`,
    weekly_goals,
  };
}

export function generateWeeklyReport(ctx: AnalysisContext) {
  const { activities, sustainabilityIndex, streak } = ctx;
  const breakdown = computeCategoryBreakdown(activities);
  const totalCo2 = activities.reduce((s, a) => s + a.co2_kg, 0);
  const topCat = breakdown.sort((a, b) => b.co2_kg - a.co2_kg)[0];

  return {
    summary: `This week you logged ${activities.length} activities totaling ${Math.round(totalCo2 * 10) / 10} kg CO2. ${topCat ? `Top category: ${topCat.category}.` : ''} Sustainability index: ${sustainabilityIndex}/100. Streak: ${streak} days.`,
    impact_score: `${sustainabilityIndex}/100`,
    recommendations: generateRecommendations(ctx).recommendations.slice(0, 3),
    weekly_goals: generateRecommendations(ctx).weekly_goals,
  };
}
