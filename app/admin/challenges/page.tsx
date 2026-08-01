import { ChallengeManager } from '@/components/ChallengeManager';
import { requireAdmin } from '@/lib/admin';

type ChallengeRow = {
  id: string;
  title: string;
  description: string;
  target_co2_kg: number;
  reward_xp: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

export default async function AdminChallengesPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from('challenges')
    .select('id, title, description, target_co2_kg, reward_xp, start_date, end_date, is_active, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Challenges</h1>
        <p className="text-muted-foreground mt-1">Create, activate, and archive community challenges.</p>
      </div>
      <ChallengeManager initialChallenges={(data ?? []) as ChallengeRow[]} />
    </div>
  );
}
