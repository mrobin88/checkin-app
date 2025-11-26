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
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">No recent activity</p>
          <p className="text-sm text-gray-500 mt-1">
            Check in to places to see activity here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {checkins.map((checkin) => {
          const category = VENUE_CATEGORIES.find(
            c => c.id === checkin.venue?.category
          );
          const timeAgo = formatDistanceToNow(new Date(checkin.timestamp), {
            addSuffix: true
          });

          return (
            <div
              key={checkin.id}
              className="bg-white border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <img
                  src={
                    checkin.user?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${checkin.user?.username}`
                  }
                  alt={checkin.user?.username}
                  className="w-12 h-12 rounded-full flex-shrink-0"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {checkin.user?.username}
                    </span>
                    <span className="text-gray-500 text-sm">checked in at</span>
                  </div>

                  {/* Venue */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{category?.icon || '📍'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {checkin.venue?.name}
                      </h3>
                      {checkin.venue?.verified && (
                        <span className="text-primary-500 text-sm">✓ Verified</span>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  {checkin.comment && (
                    <p className="text-gray-700 mb-2">{checkin.comment}</p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {category?.name || 'Other'}
                    </span>
                    <span>{timeAgo}</span>
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

