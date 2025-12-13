import { useState, useEffect } from 'react';
import { X, Loader2, Shield, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
  onContinueAnonymous: () => void;
}

export default function AuthModal({ onClose, onContinueAnonymous }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Auto-close modal when user successfully logs in
  useEffect(() => {
    if (user) {
      onClose();
    }
  }, [user, onClose]);

  const handleOAuthLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account', // Always show account picker for easier switching
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('OAuth error:', err);
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  const handleAnonymous = () => {
    onContinueAnonymous();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gradient-to-b from-white to-gray-100 rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-white/50 animate-slideUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
        >
          <X size={20} />
        </button>

        {/* Logo/Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">📍</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Welcome to CheckIn</h2>
          <p className="text-sm text-gray-600 mt-1">Discover and share places</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700 text-center">{error}</p>
          </div>
        )}

        {/* Single Google Sign In Button - Primary Action */}
        <button
          onClick={handleOAuthLogin}
          disabled={loading}
          className="w-full py-4 px-4 bg-white text-gray-800 font-semibold rounded-xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-gray-300 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Guest Option - Subtle */}
        <button
          onClick={handleAnonymous}
          disabled={loading}
          className="w-full mt-3 py-3 px-4 text-gray-600 font-medium rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Zap size={16} />
          Try without account
        </button>

        {/* Benefits */}
        <div className="mt-6 pt-5 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Shield size={14} className="text-green-500" />
            <span>Your location is never stored. Check-ins are anonymous by default.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
