'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';

type Challenge = {
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

export function ChallengeManager({ initialChallenges }: { initialChallenges: Challenge[] }) {
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('100');
  const [rewardXp, setRewardXp] = useState('100');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return challenges;
    return challenges.filter((c) => {
      return c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    });
  }, [challenges, query]);

  const createChallenge = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    const targetValue = Number(target);
    const rewardValue = Number(rewardXp);

    if (Number.isNaN(targetValue) || Number.isNaN(rewardValue)) {
      toast.error('Target and reward must be valid numbers');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      target_co2_kg: targetValue,
      reward_xp: rewardValue,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('challenges')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    setChallenges((prev) => [data as Challenge, ...prev]);
    setTitle('');
    setDescription('');
    setTarget('100');
    setRewardXp('100');
    toast.success('Challenge created');
  };

  const toggleChallenge = async (id: string, nextActive: boolean) => {
    setBusyId(id);
    const { error } = await supabase.from('challenges').update({ is_active: nextActive }).eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: nextActive } : c)));
      toast.success(nextActive ? 'Challenge activated' : 'Challenge archived');
    }
    setBusyId(null);
  };

  const deleteChallenge = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.from('challenges').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      setChallenges((prev) => prev.filter((c) => c.id !== id));
      toast.success('Challenge deleted');
    }
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <Card className="glass rounded-2xl p-5">
        <h3 className="font-semibold">Create Challenge</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Example: July Challenge - reduce 100kg CO2 and reward 100 XP.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="July Challenge" />
          </div>
          <div className="space-y-2">
            <Label>Target CO2 (kg)</Label>
            <Input value={target} onChange={(e) => setTarget(e.target.value)} type="number" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Reduce 100kg CO2 through sustainable habits"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Reward (XP)</Label>
            <Input value={rewardXp} onChange={(e) => setRewardXp(e.target.value)} type="number" />
          </div>
        </div>
        <Button className="mt-4" onClick={createChallenge}>Create Challenge</Button>
      </Card>

      <div className="space-y-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search challenges"
          className="max-w-md"
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Challenge</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((challenge) => {
              const busy = busyId === challenge.id;
              return (
                <TableRow key={challenge.id}>
                  <TableCell>
                    <p className="font-medium">{challenge.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{challenge.description}</p>
                  </TableCell>
                  <TableCell>{challenge.target_co2_kg} kg CO2</TableCell>
                  <TableCell>{challenge.reward_xp} XP</TableCell>
                  <TableCell>
                    <Badge variant={challenge.is_active ? 'default' : 'secondary'}>
                      {challenge.is_active ? 'Active' : 'Archived'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => toggleChallenge(challenge.id, !challenge.is_active)}
                      >
                        {challenge.is_active ? 'Archive' : 'Activate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        onClick={() => deleteChallenge(challenge.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
