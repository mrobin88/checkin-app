import { formatDistanceToNow } from 'date-fns';
import { MapPin, MessageCircle } from 'lucide-react';
import { CheckIn } from '../types';
import { VENUE_CATEGORIES } from '../types';

interface ActivityFeedProps {
  checkins: CheckIn[];
}

export default function ActivityFeed({ checkins }: ActivityFeedProps) {
  if (checkins.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8 bg-[#c5ccd4]">
        <div className="text-center bg-white rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] p-6 border border-gray-300">
          <MessageCircle size={48} className="mx-auto text-gray-400 mb-3 drop-shadow" />
          <p className="text-gray-700 font-bold" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
            No recent activity
          </p>
          <p className="text-sm text-gray-600 mt-1" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
            Check in to places to see activity here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#c5ccd4] p-3 space-y-2">
      <div className="max-w-2xl mx-auto">
        {checkins.map((checkin) => {
          const category = VENUE_CATEGORIES.find(
            c => c.id === checkin.venue?.category
          );
          const timeAgo = formatDistanceToNow(new Date(checkin.checked_in_at), {
            addSuffix: true
          });

          return (
            <div
              key={checkin.id}
              className="bg-white rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] border border-gray-300 p-3 hover:shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] transition-all"
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <img
                  src={
                    checkin.user?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${checkin.user?.username}`
                  }
                  alt={checkin.user?.username}
                  className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-gray-300 shadow-md"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
                      {checkin.user?.username}
                    </span>
                    <span className="text-gray-600 text-xs" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
                      checked in at
                    </span>
                  </div>

                  {/* Venue */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg drop-shadow">{category?.icon || '📍'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-sm" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
                        {checkin.venue?.name}
                      </h3>
                      {checkin.venue?.verified && (
                        <span className="text-blue-600 text-xs">✓ Verified</span>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  {checkin.comment && (
                    <p className="text-gray-800 mb-2 text-sm" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
                      {checkin.comment}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-[10px] text-gray-600">
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-b from-gray-100 to-gray-200 rounded border border-gray-300 shadow-sm">
                      <MapPin size={10} />
                      {category?.name || 'Other'}
                    </span>
                    <span style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>{timeAgo}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

