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
  const [loading, setLoading] = useState(true); // ✅ Start as loading

  useEffect(() => {
    // Check if user is already logged in (on page load/refresh)
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        if (session?.user) {
          loadAdminProfile(session.user.id);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setLoading(false); // ✅ Always set loading to false
      }
    };

    checkAuth();

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadAdminProfile(session.user.id);
      } else {
        setAdmin(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAdminProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('admins')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (data) {
        setAdmin(data);
      }
    } catch (error) {
      console.error('Profile load error:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    
    if (error) throw error;
    
    if (data.user) {
      const { error: profileError } = await supabase
        .from('admins')
        .insert({
          id: data.user.id,
          email,
          name,
        });
      
      if (profileError) throw profileError;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setAdmin(null);
    setUser(null);
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
