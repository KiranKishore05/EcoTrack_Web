'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, PlusCircle, Target, Brain, Trophy,
  FileBarChart, Settings, Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/activities', label: 'Activities', icon: PlusCircle },
  { href: '/budget', label: 'Carbon Budget', icon: Target },
  { href: '/recommendations', label: 'AI Insights', icon: Brain },
  { href: '/achievements', label: 'Achievements', icon: Trophy },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border/50 glass z-40">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
          <Leaf className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">EcoTrack</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-border/50">
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground">EcoTrack v1.0</p>
          <p className="text-xs text-primary font-medium mt-0.5">Carbon Neutral</p>
        </div>
      </div>
    </aside>
  );
}
