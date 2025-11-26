import { useState } from 'react';
import { X, MapPin, AlertCircle } from 'lucide-react';
import { Venue, Location } from '../types';
import { VENUE_CATEGORIES } from '../types';
import { distance } from '../lib/geohash';

interface CheckInModalProps {
  venue: Venue;
  userLocation: Location | null;
  onClose: () => void;
  onCheckIn: (venueId: string, comment?: string) => void;
}

export default function CheckInModal({ venue, userLocation, onClose, onCheckIn }: CheckInModalProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const category = VENUE_CATEGORIES.find(c => c.id === venue.category);
  
  // Calculate distance
  const distanceMeters = userLocation
    ? distance(userLocation.lat, userLocation.lng, venue.lat, venue.lng)
    : null;

  const tooFar = distanceMeters !== null && distanceMeters > 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tooFar || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCheckIn(venue.id, comment);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end justify-center z-50 animate-fadeIn">
      <div className="bg-gradient-to-b from-[#c5ccd4] to-[#a8b4c0] rounded-t-2xl w-full max-w-lg p-4 animate-slideUp shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border-t-2 border-white/30">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl drop-shadow-md">{category?.icon || '📍'}</span>
              <h2 
                className="text-xl font-bold text-gray-900" 
                style={{ textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}
              >
                {venue.name}
              </h2>
              {venue.verified && (
                <span className="text-blue-600">✓</span>
              )}
            </div>
            {venue.address && (
              <p 
                className="text-sm text-gray-700 flex items-center gap-1" 
                style={{ textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}
              >
                <MapPin size={14} />
                {venue.address}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 p-1 active:scale-90 transition-transform"
          >
            <X size={24} />
          </button>
        </div>

        {/* Distance Warning */}
        {tooFar && (
          <div className="mb-3 p-3 bg-gradient-to-b from-yellow-50 to-yellow-100 border border-yellow-300 rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] flex items-start gap-2">
            <AlertCircle size={20} className="text-yellow-700 flex-shrink-0 mt-0.5 drop-shadow" />
            <div>
              <p className="text-sm font-bold text-yellow-900" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
                Too far to check in
              </p>
              <p className="text-xs text-yellow-800 mt-1">
                You're {Math.round(distanceMeters!)}m away. You must be within 100m of the venue.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-3 mb-4 p-3 bg-white rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.12)] border border-gray-300">
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-gray-900" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
              {venue.checkin_count || 0}
            </div>
            <div className="text-[10px] text-gray-600 font-medium" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
              Check-ins
            </div>
          </div>
          {distanceMeters !== null && (
            <div className="flex-1 text-center border-l border-gray-300">
              <div className="text-2xl font-bold text-gray-900" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
                {distanceMeters < 1000
                  ? `${Math.round(distanceMeters)}m`
                  : `${(distanceMeters / 1000).toFixed(1)}km`}
              </div>
              <div className="text-[10px] text-gray-600 font-medium" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
                Away
              </div>
            </div>
          )}
        </div>

        {/* Check-in Form */}
        <form onSubmit={handleSubmit}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What's happening? (optional)"
            className="w-full p-3 bg-white border border-gray-400 rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900"
            rows={3}
            maxLength={280}
          />
          <p className="text-[10px] text-gray-600 mt-1 text-right" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}>
            {comment.length}/280
          </p>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gradient-to-b from-gray-200 to-gray-300 text-gray-800 font-bold rounded-lg shadow-md border border-gray-400 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:from-gray-300 active:to-gray-200 transition-all"
              style={{ textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={tooFar || isSubmitting}
              className="flex-1 py-3 px-4 bg-gradient-to-b from-[#5ba4e5] to-[#3b7fc4] text-white font-bold rounded-lg shadow-md border border-[#2d5f9f] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:from-[#3b7fc4] active:to-[#5ba4e5] transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:border-gray-600"
              style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.3)' }}
            >
              {isSubmitting ? 'Checking in...' : 'Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

