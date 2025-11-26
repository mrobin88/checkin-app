import { MapPin } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
          <MapPin size={20} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">CheckIn</h1>
      </div>
      
      <button className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
          alt="User avatar"
          className="w-full h-full"
        />
      </button>
    </header>
  );
}

