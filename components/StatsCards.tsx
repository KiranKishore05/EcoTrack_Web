import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatCardItem = {
  label: string;
  value: string;
  hint: string;
  tone?: 'default' | 'positive' | 'warning';
};

export function StatsCards({ items }: { items: StatCardItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                item.tone === 'positive' && 'text-primary',
                item.tone === 'warning' && 'text-chart-4'
              )}
            >
              {item.hint}
            </Badge>
          </div>
          <p className="text-3xl font-semibold tracking-tight mt-2">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
