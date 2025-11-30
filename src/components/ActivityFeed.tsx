import { useState, useMemo } from 'react';
import { Globe, Navigation, MessageCircle, MapPin } from 'lucide-react';
import { CheckIn, Location } from '../types';
import CheckInCard from './CheckInCard';

// Distance filter options in miles
const DISTANCE_FILTERS = [
  { id: 'nearby', label: 'Nearby', miles: 10, icon: Navigation },
  { id: 'city', label: '25 mi', miles: 25, icon: MapPin },
  { id: 'region', label: '100 mi', miles: 100, icon: MapPin },
  { id: 'global', label: 'Global', miles: Infinity, icon: Globe },
] as const;

// Extended CheckIn type with distance
interface CheckInWithDistance extends CheckIn {
  distance?: number;
}

// Calculate distance between two points in miles (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface ActivityFeedProps {
  checkins: CheckIn[];
  userLocation: Location | null;
  onReply: (checkInId: string, originalUser: string, venueName: string) => void;
}

export default function ActivityFeed({ checkins, userLocation, onReply }: ActivityFeedProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('nearby');

  // Filter and sort check-ins by distance
  const filteredCheckins: CheckInWithDistance[] = useMemo(() => {
    const filter = DISTANCE_FILTERS.find((f) => f.id === selectedFilter) || DISTANCE_FILTERS[0];

    if (!userLocation) {
      // No location available, show all (global)
      return checkins.map((c) => ({ ...c, distance: undefined }));
    }

    return checkins
      .map((checkin) => {
        const venueLat = checkin.venue?.lat;
        const venueLng = checkin.venue?.lng;

        if (venueLat && venueLng) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            venueLat,
            venueLng
          );
          return { ...checkin, distance };
        }
        return { ...checkin, distance: Infinity };
      })
      .filter((checkin) => (checkin.distance ?? Infinity) <= filter.miles)
      .sort((a, b) => {
        // Sort by time (most recent first) for global, by distance for local
        if (filter.id === 'global') {
          return new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime();
        }
        return (a.distance ?? 0) - (b.distance ?? 0);
      });
  }, [checkins, userLocation, selectedFilter]);

  const currentFilter =
    DISTANCE_FILTERS.find((f) => f.id === selectedFilter) || DISTANCE_FILTERS[0];

  if (checkins.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8 bg-[#c5ccd4]">
        <div className="text-center bg-white rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] p-6 border border-gray-300">
          <MessageCircle size={48} className="mx-auto text-gray-400 mb-3 drop-shadow" />
          <p
            className="text-gray-700 font-bold"
            style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
          >
            No recent activity
          </p>
          <p
            className="text-sm text-gray-600 mt-1"
            style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
          >
            Check in to places to see activity here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#c5ccd4]">
      {/* Filter Bar */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-400 bg-gradient-to-b from-[#d8dde3] to-[#c5ccd4]">
        <div className="flex gap-1 max-w-2xl mx-auto">
          {DISTANCE_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const isSelected = selectedFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#5ba4e5] to-[#3b7fc4] text-white shadow-md border border-[#2d5f9f]'
                    : 'bg-gradient-to-b from-white to-gray-100 text-gray-700 border border-gray-300 shadow-sm hover:from-gray-50 hover:to-gray-150'
                }`}
                style={
                  isSelected
                    ? { textShadow: '0 -1px 0 rgba(0,0,0,0.3)' }
                    : { textShadow: '0 1px 0 rgba(255,255,255,0.8)' }
                }
              >
                <Icon size={12} />
                {filter.label}
              </button>
            );
          })}
        </div>
        {/* Results count */}
        <p
          className="text-center text-[10px] text-gray-600 mt-1"
          style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
        >
          {filteredCheckins.length} {filteredCheckins.length === 1 ? 'check-in' : 'check-ins'}
          {currentFilter.id !== 'global' && userLocation && ` within ${currentFilter.miles} mi`}
          {currentFilter.id === 'global' && ' worldwide'}
        </p>
      </div>

      {/* Check-ins List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredCheckins.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-white rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] p-6 border border-gray-300">
              <Navigation size={48} className="mx-auto text-gray-400 mb-3 drop-shadow" />
              <p
                className="text-gray-700 font-bold"
                style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
              >
                No activity {currentFilter.id !== 'global' ? 'nearby' : ''}
              </p>
              <p
                className="text-sm text-gray-600 mt-1"
                style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
              >
                {currentFilter.id !== 'global'
                  ? 'Try expanding your search radius'
                  : 'Be the first to check in!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {filteredCheckins.map((checkin) => (
              <CheckInCard
                key={checkin.id}
                checkin={checkin}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
