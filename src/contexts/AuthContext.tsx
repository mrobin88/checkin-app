import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** Custom profile avatar URL (from users.avatar_url); overrides OAuth avatar when set */
  profileAvatarUrl: string | null;
  /** Refetch profile avatar from DB (e.g. after upload) */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);

  const fetchProfileAvatar = async (userId: string) => {
    try {
      const { data } = await supabase.from('users').select('avatar_url').eq('id', userId).single();
      setProfileAvatarUrl(data?.avatar_url && data.avatar_url.trim() ? data.avatar_url : null);
    } catch {
      setProfileAvatarUrl(null);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfileAvatar(user.id);
  };

  useEffect(() => {
    // Clean up OAuth hash from URL immediately to prevent flicker
    const cleanupUrlHash = () => {
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('🧹 Cleaning up OAuth hash from URL');
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    // Get initial session
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        
        console.log(
          '🔐 Auth initialized:',
          session?.user ? `Logged in as ${session.user.email}` : 'Not logged in'
        );
        
        const u = session?.user ?? null;
        setUser(u);
        if (u?.id) await fetchProfileAvatar(u.id);
        setLoading(false);

        // Clean up URL after processing OAuth tokens
        cleanupUrlHash();
      } catch (error) {
        console.error('❌ Error loading session:', error);
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        '🔄 Auth state changed:',
        event,
        session?.user ? `User: ${session.user.email}` : 'No user'
      );
      const u = session?.user ?? null;
      setUser(u);
      if (u?.id) await fetchProfileAvatar(u.id);
      else setProfileAvatarUrl(null);
      setLoading(false);

      // Clean up URL on auth state changes too
      cleanupUrlHash();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      console.log('👋 Signing out...');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, profileAvatarUrl, refreshProfile, signOut }}>
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

