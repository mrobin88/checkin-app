import { useState, useEffect } from 'react';
import { TrendingUp, Users, Flame, ChevronRight, Loader2 } from 'lucide-react';
import { getTrendingSpots } from '../lib/notifications';
import { VENUE_CATEGORIES } from '../types';

interface TrendingSpot {
  venue_id: string;
  venue_name: string;
  venue_category: string;
  count: number;
}

interface TrendingSpotsProps {
  onVenueClick?: (venueId: string, venueName: string) => void;
}

export default function TrendingSpots({ onVenueClick }: TrendingSpotsProps) {
  const [spots, setSpots] = useState<TrendingSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      const trending = await getTrendingSpots(30, 5);
      setSpots(trending);
      setLoading(false);
    };

    fetchTrending();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchTrending, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
        <div className="flex items-center justify-center py-4">
          <Loader2 size={24} className="animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  if (spots.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-orange-200 bg-gradient-to-r from-orange-100 to-red-100">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow">
          <Flame size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-orange-900 text-sm">Trending Now</h3>
          <p className="text-xs text-orange-700">Hot spots in the last 30 mins</p>
        </div>
        <TrendingUp size={18} className="text-orange-500" />
      </div>

      {/* Trending Spots List */}
      <div className="divide-y divide-orange-100">
        {spots.map((spot, index) => {
          const category = VENUE_CATEGORIES.find((c) => c.id === spot.venue_category);
          return (
            <button
              key={spot.venue_id}
              onClick={() => onVenueClick?.(spot.venue_id, spot.venue_name)}
              className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 transition-colors text-left"
            >
              {/* Rank */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                    : index === 1
                    ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
                    : index === 2
                    ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white'
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                {index + 1}
              </div>

              {/* Icon */}
              <span className="text-xl">{category?.icon || '📍'}</span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{spot.venue_name}</p>
                <div className="flex items-center gap-2 text-xs text-orange-700">
                  <span className="flex items-center gap-0.5">
                    <Users size={10} />
                    {spot.count} check-ins
                  </span>
                  <span className="w-1 h-1 rounded-full bg-orange-400" />
                  <span>{category?.name || 'Place'}</span>
                </div>
              </div>

              <ChevronRight size={16} className="text-orange-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Compact badge for showing on map/feed
export function TrendingBadge({ count }: { count: number }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow animate-pulse">
      <Flame size={10} />
      {count} here now
    </div>
  );
}

