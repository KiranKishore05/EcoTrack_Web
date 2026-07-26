'use client';

import { motion } from 'framer-motion';
import {
  Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  TrendingDown, Leaf, Target, Flame, Zap, Droplets, Car, Utensils,
  Trash2, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { xpToNextLevel } from '@/lib/carbon-engine';
import { ActivityCalendar } from 'react-activity-calendar';

const CATEGORY_COLORS: Record<string, string> = {
  transport: 'hsl(var(--chart-1))',
  food: 'hsl(var(--chart-2))',
  energy: 'hsl(var(--chart-3))',
  water: 'hsl(var(--chart-4))',
  waste: 'hsl(var(--chart-5))',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  transport: Car,
  food: Utensils,
  energy: Zap,
  water: Droplets,
  waste: Trash2,
};

export default function DashboardPage() {
  const { stats, loading } = useDashboardData();

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const xpInfo = xpToNextLevel(stats.totalXp);
  const budgetPct = stats.budgetUsed > 0
    ? Math.min(100, Math.round((stats.budgetUsed / (stats.budgetUsed + stats.budgetRemaining)) * 100))
    : 0;

  const cards = [
    {
      label: 'Carbon Score',
      value: `${stats.sustainabilityIndex}`,
      suffix: '/100',
      icon: Leaf,
      trend: stats.sustainabilityIndex >= 75 ? 'up' : 'down',
      trendValue: stats.sustainabilityIndex >= 75 ? 'Excellent' : 'Improving',
      color: 'text-primary',
    },
    {
      label: 'Monthly Emissions',
      value: `${stats.budgetUsed}`,
      suffix: 'kg CO₂',
      icon: TrendingDown,
      trend: 'down',
      trendValue: `${stats.dailyAverage} kg/day avg`,
      color: 'text-chart-2',
    },
    {
      label: 'Budget Remaining',
      value: `${stats.budgetRemaining}`,
      suffix: 'kg CO₂',
      icon: Target,
      trend: stats.budgetRemaining > 0 ? 'up' : 'down',
      trendValue: `${budgetPct}% used`,
      color: 'text-chart-3',
    },
    {
      label: 'Day Streak',
      value: `${stats.streak}`,
      suffix: 'days',
      icon: Flame,
      trend: 'up',
      trendValue: `Level ${stats.level}`,
      color: 'text-chart-4',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your sustainability overview at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          >
            <Card className="glass rounded-2xl p-5 hover:glow-primary transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <c.icon className={`w-5 h-5 ${c.color}`} />
                </div>
                <Badge variant="secondary" className="gap-1 text-xs">
                  {c.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3 text-primary" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-muted-foreground" />
                  )}
                  {c.trendValue}
                </Badge>
              </div>
              <div className="text-2xl font-bold tracking-tight">
                {c.value}
                <span className="text-sm font-normal text-muted-foreground ml-1">{c.suffix}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">{c.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trend line chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="lg:col-span-2"
        >
          <Card className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Emission Trend</h3>
                <p className="text-xs text-muted-foreground">Daily CO₂ over the last 14 days</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.trend}>
                <defs>
                  <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  labelFormatter={(d) => `Date: ${d}`}
                  formatter={(v: number) => [`${v} kg`, 'CO₂']}
                />
                <Area
                  type="monotone"
                  dataKey="co2_kg"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  fill="url(#co2Grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Category pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="glass rounded-2xl p-5 h-full">
            <h3 className="font-semibold mb-1">Category Breakdown</h3>
            <p className="text-xs text-muted-foreground mb-4">Emissions by source</p>
            {stats.categoryBreakdown.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={stats.categoryBreakdown}
                      dataKey="co2_kg"
                      nameKey="category"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {stats.categoryBreakdown.map((entry) => (
                        <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(v: number, _n: string, p: { payload?: { category?: string } }) => [
                        `${v} kg`,
                        p?.payload?.category ?? '',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {stats.categoryBreakdown.map((c) => {
                    const Icon = CATEGORY_ICONS[c.category] ?? Leaf;
                    return (
                      <div key={c.category} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 capitalize">
                          <Icon className="w-3.5 h-3.5" style={{ color: CATEGORY_COLORS[c.category] }} />
                          {c.category}
                        </span>
                        <span className="text-muted-foreground">{c.percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Budget + XP row */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <Card className="glass rounded-2xl p-5">
            <h3 className="font-semibold mb-1">Carbon Budget</h3>
            <p className="text-xs text-muted-foreground mb-4">Monthly usage tracking</p>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold">{stats.budgetUsed} kg</span>
              <span className="text-sm text-muted-foreground">
                of {stats.budgetUsed + stats.budgetRemaining} kg
              </span>
            </div>
            <Progress value={budgetPct} className="h-2.5" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{budgetPct}% used</span>
              <span>{stats.budgetRemaining > 0 ? `${stats.budgetRemaining} kg left` : 'Over budget'}</span>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="glass rounded-2xl p-5">
            <h3 className="font-semibold mb-1">Level Progress</h3>
            <p className="text-xs text-muted-foreground mb-4">XP toward next level</p>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-2xl font-bold">Level {stats.level}</span>
              <span className="text-sm text-muted-foreground">{stats.totalXp} total XP</span>
            </div>
            <Progress value={xpInfo.percent} className="h-2.5" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{xpInfo.current} XP</span>
              <span>{xpInfo.needed} XP to level {stats.level + 1}</span>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Category bar chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.45 }}
      >
        <Card className="glass rounded-2xl p-5">
          <h3 className="font-semibold mb-1">Emissions by Category</h3>
          <p className="text-xs text-muted-foreground mb-4">Total CO₂ (kg) per category</p>
          {stats.categoryBreakdown.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              Log activities to see your breakdown
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(v: number) => [`${v} kg`, 'CO₂']}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="co2_kg" radius={[6, 6, 0, 0]}>
                  {stats.categoryBreakdown.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </motion.div>

      {/* Streak Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card className="glass rounded-2xl p-5 overflow-hidden">
          <h3 className="font-semibold mb-1">Activity Heatmap</h3>
          <p className="text-xs text-muted-foreground mb-4">Your daily logging streak (GitHub style)</p>
          
          <div className="w-full overflow-x-auto pb-2 flex justify-center custom-scrollbar">
            {stats.heatmapData && stats.heatmapData.length > 0 ? (
              <ActivityCalendar
                data={stats.heatmapData}
                theme={{
                  light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                  dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                }}
                colorScheme="dark"
                labels={{
                  totalCount: '{{count}} activities in the last year',
                }}
                blockSize={12}
                blockRadius={4}
                blockMargin={4}
              />
            ) : (
              <div className="h-[120px] flex items-center justify-center text-sm text-muted-foreground w-full">
                Log activities to see your heatmap
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
