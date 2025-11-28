import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
        
        setUser(session?.user ?? null);
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        '🔄 Auth state changed:',
        event,
        session?.user ? `User: ${session.user.email}` : 'No user'
      );
      setUser(session?.user ?? null);
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
    <AuthContext.Provider value={{ user, loading, signOut }}>
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

