import { MapPin, Users, Bookmark, TrendingUp } from 'lucide-react';
import { hapticSelection } from '../lib/haptics';

interface QuickAction {
  id: string;
  label: string;
  icon: typeof MapPin;
  color: string;
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export default function QuickActions({ actions }: QuickActionsProps) {
  const handleClick = (action: QuickAction) => {
    hapticSelection();
    action.onClick();
  };

  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => handleClick(action)}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow border border-gray-300 active:scale-95 transition-transform"
          >
            <div className={`w-12 h-12 rounded-full bg-gradient-to-b ${action.color} flex items-center justify-center`}>
              <Icon size={24} className="text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Pre-built action sets
export const defaultQuickActions: QuickAction[] = [
  {
    id: 'nearby',
    label: 'Nearby',
    icon: MapPin,
    color: 'from-blue-400 to-blue-500',
    onClick: () => {},
  },
  {
    id: 'friends',
    label: 'Friends',
    icon: Users,
    color: 'from-green-400 to-green-500',
    onClick: () => {},
  },
  {
    id: 'saved',
    label: 'Saved',
    icon: Bookmark,
    color: 'from-yellow-400 to-yellow-500',
    onClick: () => {},
  },
  {
    id: 'trending',
    label: 'Hot',
    icon: TrendingUp,
    color: 'from-red-400 to-red-500',
    onClick: () => {},
  },
];

