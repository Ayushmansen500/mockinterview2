import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Admin {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        loadAdminProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Failed to get session:', err);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadAdminProfile(session.user.id);
      } else {
        setAdmin(null);
        setLoading(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const loadAdminProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading admin profile:', error);
        // Don't throw - just proceed without admin profile
        setAdmin(null);
      } else if (data) {
        setAdmin(data as Admin);
      }
    } catch (err) {
      console.error('Failed to load admin profile:', err);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw new Error(error.message || 'Failed to sign in');
      }
    } catch (err) {
      console.error('Sign in failed:', err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Sign up error:', error);
        throw new Error(error.message || 'Failed to sign up');
      }

      if (data.user) {
        // Try to create admin profile, but don't fail if it doesn't work
        try {
          const { error: profileError } = await supabase
            .from('admins')
            .insert({
              id: data.user.id,
              email,
              name,
            });

          if (profileError) {
            console.warn('Warning: Could not create admin profile:', profileError);
            // Don't throw - user is created, just profile creation failed
          }
        } catch (profileErr) {
          console.warn('Warning: Failed to create admin profile:', profileErr);
        }
      }
    } catch (err) {
      console.error('Sign up failed:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw new Error(error.message || 'Failed to sign out');
      }
    } catch (err) {
      console.error('Sign out failed:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, admin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
