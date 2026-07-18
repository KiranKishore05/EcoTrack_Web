import type { Badge } from './types';

export const BADGES: Badge[] = [
  {
    key: 'green_starter',
    name: 'Green Starter',
    description: 'Log your first activity',
    icon: 'Sprout',
    requirement: 1,
    xp: 50,
    tier: 'bronze',
  },
  {
    key: 'eco_warrior',
    name: 'Eco Warrior',
    description: 'Log 25 activities',
    icon: 'Sword',
    requirement: 25,
    xp: 200,
    tier: 'silver',
  },
  {
    key: 'carbon_saver',
    name: 'Carbon Saver',
    description: 'Save 50 kg of CO2 in a month',
    icon: 'Save',
    requirement: 50,
    xp: 300,
    tier: 'silver',
  },
  {
    key: 'tree_protector',
    name: 'Tree Protector',
    description: 'Maintain a 7-day logging streak',
    icon: 'TreePine',
    requirement: 7,
    xp: 250,
    tier: 'gold',
  },
  {
    key: 'climate_hero',
    name: 'Climate Hero',
    description: 'Reach sustainability index of 90+',
    icon: 'Award',
    requirement: 90,
    xp: 500,
    tier: 'platinum',
  },
  {
    key: 'month_master',
    name: 'Month Master',
    description: 'Log activities for 30 days',
    icon: 'Calendar',
    requirement: 30,
    xp: 400,
    tier: 'gold',
  },
  {
    key: 'renewable_advocate',
    name: 'Renewable Advocate',
    description: 'Log 10 renewable energy activities',
    icon: 'Sun',
    requirement: 10,
    xp: 200,
    tier: 'silver',
  },
  {
    key: 'plant_based',
    name: 'Plant Pioneer',
    description: 'Log 20 vegan or vegetarian meals',
    icon: 'Leaf',
    requirement: 20,
    xp: 250,
    tier: 'gold',
  },
];

export const BADGE_MAP: Record<string, Badge> = Object.fromEntries(
  BADGES.map((b) => [b.key, b])
);
