import { MapPin, Users } from 'lucide-react';
import { Venue } from '../types';
import { VENUE_CATEGORIES } from '../types';

interface VenueListProps {
  venues: Venue[];
  loading: boolean;
  onVenueClick: (venue: Venue) => void;
}

export default function VenueList({ venues, loading, onVenueClick }: VenueListProps) {
  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="p-8 text-center">
        <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-600 font-medium">No venues nearby</p>
        <p className="text-sm text-gray-500 mt-1">
          Move around or zoom out to discover places
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {venues.map((venue) => {
        const category = VENUE_CATEGORIES.find(c => c.id === venue.category);
        
        return (
          <button
            key={venue.id}
            onClick={() => onVenueClick(venue)}
            className="w-full p-4 flex gap-3 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
              {category?.icon || '📍'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {venue.name}
                </h3>
                {venue.verified && (
                  <span className="text-primary-500 text-sm">✓</span>
                )}
              </div>
              
              {venue.address && (
                <p className="text-xs text-gray-600 truncate mb-1">
                  {venue.address}
                </p>
              )}
              
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {venue.checkin_count || 0} check-ins
                </span>
                <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                  {category?.name || 'Other'}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

