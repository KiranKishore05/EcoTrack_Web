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

  /**
   * Upserts a user's profile row.
   * This is a CLIENT-SIDE SAFETY NET only.
   * The primary profile creation is handled by the `on_auth_user_created`
   * database trigger, which fires automatically for every new signup.
   * This function handles edge cases like Google OAuth where user metadata
   * may need to be synced client-side.
   */
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

  /**
   * Loads a user's profile from the database.
   * The `on_auth_user_created` trigger guarantees a profile row exists
   * for every authenticated user, so this should always find a row.
   * The fallback upsert covers rare edge cases (e.g., the trigger failing).
   */
  const loadProfile = useCallback(
    async (authUser: User) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Profile load error:', error.message);
        return;
      }

      if (!data) {
        // Fallback: profile row missing (trigger may have failed).
        // Reconstruct from auth metadata so the user is never stuck.
        await upsertProfile(authUser.id, {
          display_name:
            authUser.user_metadata?.display_name ||
            authUser.user_metadata?.full_name ||
            authUser.email?.split('@')[0] ||
            'User',
          email: authUser.email,
        });
      } else {
        setProfile(data as Profile);
      }
    },
    [upsertProfile]
  );

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user);
  }, [user, loadProfile]);

  useEffect(() => {
    let mounted = true;

    // Load existing session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;

      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        loadProfile(s.user).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      (async () => {
        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          await loadProfile(s.user);
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

  /**
   * Registers a new user.
   *
   * Flow:
   * 1. supabase.auth.signUp() creates the user in auth.users.
   * 2. The `on_auth_user_created` DB trigger AUTOMATICALLY creates the
   *    profiles row with display_name from user metadata.
   *    → No manual table creation is needed per user.
   * 3. If a session is returned immediately (email confirmation disabled),
   *    we also do a client-side upsert to ensure display_name is correct.
   * 4. If email confirmation is required, the trigger already has the
   *    display_name from raw_user_meta_data, so the profile is correct
   *    when the user confirms and logs in.
   */
  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // display_name stored in raw_user_meta_data so the DB trigger can
          // read it even before the user confirms their email.
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

      // If we have a session (no email confirmation required), sync profile
      // client-side to ensure display_name matches what the user typed.
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