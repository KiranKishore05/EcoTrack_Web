import { AdminNavbar } from '@/components/AdminNavbar';
import { requireAdmin } from '@/lib/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 md:py-8">{children}</main>
    </div>
  );
}
