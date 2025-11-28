import { MapPin, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onLoginClick: () => void;
}

export default function Header({ onLoginClick }: HeaderProps) {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="bg-gradient-to-b from-[#6d84a3] via-[#5a7493] to-[#4d6580] border-b-2 border-gray-800 px-4 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 bg-gradient-to-b from-[#5ba4e5] to-[#3b7fc4] rounded-full flex items-center justify-center shadow-lg border-2 border-white/30">
          <MapPin
            size={20}
            className="text-white"
            style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}
          />
        </div>
        <h1
          className="text-xl font-bold text-white"
          style={{
            textShadow: '0 -1px 0 rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.2)',
            letterSpacing: '-0.5px',
          }}
        >
          CheckIn
        </h1>
      </div>

      <div className="flex items-center gap-2 min-w-[100px] justify-end">
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
        ) : user ? (
          <>
            <img
              src={
                user.user_metadata?.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
              }
              alt="User avatar"
              className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden shadow-lg border-2 border-white/40"
            />
            <span
              className="text-sm text-white font-medium max-w-[100px] truncate"
              style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.5)' }}
            >
              {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </span>
            <button
              onClick={signOut}
              className="p-2 bg-gradient-to-b from-gray-200 to-gray-300 rounded-lg shadow-md border border-gray-400 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all"
              title="Sign out"
            >
              <LogOut size={16} className="text-gray-700" />
            </button>
          </>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-b from-[#5ba4e5] to-[#3b7fc4] text-white font-bold rounded-lg shadow-md border border-[#2d5f9f] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all text-sm"
            style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.3)' }}
          >
            <LogIn size={16} />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
