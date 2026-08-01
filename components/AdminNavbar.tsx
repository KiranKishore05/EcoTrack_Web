'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  Trophy,
  LineChart,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ADMIN_NAV_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { href: '/admin/challenges', label: 'Challenges', icon: Trophy },
  { href: '/admin/analytics', label: 'Analytics', icon: LineChart },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, profile } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border/50 glass">
      <div className="h-16 max-w-screen-2xl mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">EcoTrack Admin</p>
            <p className="text-xs text-muted-foreground mt-1">Role: {profile?.role ?? 'user'}</p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {ADMIN_NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;

            return (
              <Link key={link.href} href={link.href}>
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>User App</Button>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => signOut().then(() => router.push('/login'))}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
