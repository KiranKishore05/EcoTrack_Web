'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  PlusCircle,
  Target,
  Brain,
  Trophy,
  FileBarChart,
  Settings,
  Leaf,
  Bot,
  Scan,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/activities', label: 'Activities', icon: PlusCircle },
  { href: '/dashboard/scanner', label: 'Scanner', icon: Scan },
  { href: '/budget', label: 'Carbon Budget', icon: Target },
  { href: '/dashboard/coach', label: 'AI Coach', icon: Bot },
  { href: '/recommendations', label: 'AI Insights', icon: Brain },
  { href: '/achievements', label: 'Achievements', icon: Trophy },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen flex flex-col border-r border-border/50 bg-background glass">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Leaf className="w-4 h-4 text-primary-foreground" />
        </div>

        <span className="text-lg font-bold tracking-tight">
          EcoTrack
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
            >
              <div
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}

                <item.icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 p-4">
        <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            EcoTrack v1.0
          </p>
          <p className="mt-1 text-xs font-medium text-primary">
            Carbon Neutral
          </p>
        </div>
      </div>
    </aside>
  );
}