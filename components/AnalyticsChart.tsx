'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts';
import { Card } from '@/components/ui/card';

type TimelinePoint = {
  label: string;
  users: number;
  reports: number;
  co2: number;
  goalsCompleted: number;
};

export function AnalyticsChart({
  timeline,
  categoryData,
}: {
  timeline: TimelinePoint[];
  categoryData: Array<{ category: string; count: number }>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="glass rounded-2xl p-5 lg:col-span-2">
        <h3 className="font-semibold">Platform Trend</h3>
        <p className="text-xs text-muted-foreground mb-4">Users, reports, and carbon progress over time</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="users" stroke="hsl(var(--chart-1))" strokeWidth={2} />
            <Line type="monotone" dataKey="reports" stroke="hsl(var(--chart-2))" strokeWidth={2} />
            <Line type="monotone" dataKey="goalsCompleted" stroke="hsl(var(--chart-3))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="glass rounded-2xl p-5">
        <h3 className="font-semibold">Top Activity Categories</h3>
        <p className="text-xs text-muted-foreground mb-4">Most logged categories</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
