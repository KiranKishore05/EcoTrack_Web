'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from './types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ error: string | null; requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const upsertProfile = useCallback(
    async (
      uid: string,
      updates: Partial<
        Pick<Profile, 'display_name' | 'location' | 'bio' | 'avatar_url' | 'email'>
      > = {}
    ) => {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: uid,
            ...updates,
          },
          { onConflict: 'id' }
        )
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Profile upsert error:', error.message);
        return null;
      }

      const nextProfile = data as Profile;
      setProfile(nextProfile);
      return nextProfile;
    },
    []
  );

  const loadProfile = useCallback(
    async (uid: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (error) {
        console.error('Profile load error:', error.message);
        return;
      }

      if (!data) {
        await upsertProfile(uid);
      } else {
        setProfile(data as Profile);
      }
    },
    [upsertProfile]
  );

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;

      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        loadProfile(s.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      (async () => {
        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          await loadProfile(s.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      error: error?.message ?? null,
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        return {
          error: error.message,
          requiresEmailConfirmation: false,
        };
      }

      if (data.session?.user) {
        await upsertProfile(data.session.user.id, {
          display_name: displayName,
          email,
        });
      }

      return {
        error: null,
        requiresEmailConfirmation: !data.session,
      };
    },
    [upsertProfile]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}