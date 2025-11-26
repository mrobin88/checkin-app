import { MapPin } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-gradient-to-b from-[#6d84a3] via-[#5a7493] to-[#4d6580] border-b-2 border-gray-800 px-4 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 bg-gradient-to-b from-[#5ba4e5] to-[#3b7fc4] rounded-full flex items-center justify-center shadow-lg border-2 border-white/30">
          <MapPin size={20} className="text-white" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }} />
        </div>
        <h1 
          className="text-xl font-bold text-white" 
          style={{ 
            textShadow: '0 -1px 0 rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.2)',
            letterSpacing: '-0.5px'
          }}
        >
          CheckIn
        </h1>
      </div>
      
      <button className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden shadow-lg border-2 border-white/40 active:scale-95 transition-transform">
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
          alt="User avatar"
          className="w-full h-full"
        />
      </button>
    </header>
  );
}

