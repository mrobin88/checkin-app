import { MapPin, Users, ChevronRight } from 'lucide-react';
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
      <div className="p-3 bg-[#c5ccd4]">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="bg-white rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] p-3 border border-gray-300"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="p-8 text-center bg-[#c5ccd4]">
        <div className="bg-white rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] p-6 border border-gray-300">
          <MapPin size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-700 font-medium">No venues found</p>
          <p className="text-sm text-gray-600 mt-1">
            {loading ? 'Searching...' : 'Enable location to find nearby places'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#c5ccd4] p-3 space-y-2">
      {venues.map((venue) => {
        const category = VENUE_CATEGORIES.find(c => c.id === venue.category);
        
        return (
          <button
            key={venue.id}
            onClick={() => onVenueClick(venue)}
            className="w-full bg-white rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] border border-gray-300 hover:shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.25)] transition-all text-left"
          >
            <div className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-b from-[#e0e8f0] to-[#c8d4e0] rounded shadow-inner border border-gray-400 flex items-center justify-center text-xl flex-shrink-0">
                {category?.icon || '📍'}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-gray-900 truncate text-[15px]" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
                    {venue.name}
                  </h3>
                  {venue.verified && (
                    <span className="text-blue-600 text-xs">✓</span>
                  )}
                </div>
                
                {venue.address && (
                  <p className="text-[11px] text-gray-600 truncate mb-0.5" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
                    {venue.address}
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users size={10} />
                    {venue.checkin_count || 0}
                  </span>
                  <span className="px-1.5 py-0.5 bg-gradient-to-b from-gray-100 to-gray-200 rounded border border-gray-300 shadow-sm">
                    {category?.name || 'Other'}
                  </span>
                </div>
              </div>
              
              <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

