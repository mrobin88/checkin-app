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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 animate-slideUp">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{category?.icon || '📍'}</span>
              <h2 className="text-xl font-bold text-gray-900">{venue.name}</h2>
              {venue.verified && (
                <span className="text-primary-500">✓</span>
              )}
            </div>
            {venue.address && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin size={14} />
                {venue.address}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Distance Warning */}
        {tooFar && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Too far to check in</p>
              <p className="text-xs text-yellow-700 mt-1">
                You're {Math.round(distanceMeters!)}m away. You must be within 100m of the venue.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{venue.checkin_count || 0}</div>
            <div className="text-xs text-gray-600">Check-ins</div>
          </div>
          {distanceMeters !== null && (
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {distanceMeters < 1000
                  ? `${Math.round(distanceMeters)}m`
                  : `${(distanceMeters / 1000).toFixed(1)}km`}
              </div>
              <div className="text-xs text-gray-600">Away</div>
            </div>
          )}
        </div>

        {/* Check-in Form */}
        <form onSubmit={handleSubmit}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What's happening? (optional)"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={3}
            maxLength={280}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {comment.length}/280
          </p>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={tooFar || isSubmitting}
              className="flex-1 py-3 px-4 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Checking in...' : 'Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

