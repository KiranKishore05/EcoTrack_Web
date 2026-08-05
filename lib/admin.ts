// import 'server-only';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/server';

export type AdminProfile = {
  id: string;
  display_name: string | null;
  role: 'user' | 'moderator' | 'admin';
  is_suspended: boolean;
};

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, role, is_suspended')
    .eq('id', user.id)
    .maybeSingle<AdminProfile>();

  if (!profile || profile.role !== 'admin' || profile.is_suspended) {
    redirect('/dashboard');
  }

  return { supabase, user, profile };
}
