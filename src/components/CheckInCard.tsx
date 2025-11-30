import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MapPin,
  Reply,
  ChevronDown,
  ChevronUp,
  Navigation,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { CheckIn, Reply as ReplyType } from '../types';
import { VENUE_CATEGORIES } from '../types';
import { supabase } from '../lib/supabase';

interface CheckInWithDistance extends CheckIn {
  distance?: number;
  reply_count?: number;
}

interface CheckInCardProps {
  checkin: CheckInWithDistance;
  onReply: (checkInId: string, username: string, venueName: string) => void;
}

export default function CheckInCard({ checkin, onReply }: CheckInCardProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<ReplyType[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyCount, setReplyCount] = useState(checkin.reply_count || 0);

  // Fetch replies when accordion is opened
  useEffect(() => {
    if (showReplies && replies.length === 0 && replyCount > 0) {
      fetchReplies();
    }
  }, [showReplies]);

  const fetchReplies = async () => {
    setLoadingReplies(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, user_id, username, avatar_url, content, created_at')
        .eq('parent_message_id', checkin.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error fetching replies:', error);
      } else if (data) {
        const formattedReplies: ReplyType[] = data.map((r) => ({
          id: r.id,
          parent_id: checkin.id,
          user_id: r.user_id,
          username: r.username,
          avatar_url: r.avatar_url,
          content: r.content,
          created_at: r.created_at,
        }));
        setReplies(formattedReplies);
        setReplyCount(formattedReplies.length);
      }
    } catch (err) {
      console.error('Error fetching replies:', err);
    } finally {
      setLoadingReplies(false);
    }
  };

  // Subscribe to new replies in real-time
  useEffect(() => {
    const subscription = supabase
      .channel(`replies-${checkin.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `parent_message_id=eq.${checkin.id}`,
        },
        (payload) => {
          const newReply = payload.new as any;
          const formattedReply: ReplyType = {
            id: newReply.id,
            parent_id: checkin.id,
            user_id: newReply.user_id,
            username: newReply.username,
            avatar_url: newReply.avatar_url,
            content: newReply.content,
            created_at: newReply.created_at,
          };
          setReplies((prev) => [...prev, formattedReply]);
          setReplyCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [checkin.id]);

  const category = VENUE_CATEGORIES.find((c) => c.id === checkin.venue?.category);
  const timeAgo = formatDistanceToNow(new Date(checkin.checked_in_at), {
    addSuffix: true,
  });
  const distanceText =
    checkin.distance !== undefined && checkin.distance !== Infinity
      ? checkin.distance < 1
        ? `${Math.round(checkin.distance * 5280)} ft away`
        : `${checkin.distance.toFixed(1)} mi away`
      : null;

  return (
    <div className="bg-white rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] border border-gray-300 overflow-hidden">
      {/* Main Check-in */}
      <div className="p-3">
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
              <span
                className="font-bold text-gray-900"
                style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
              >
                {checkin.user?.username}
              </span>
              <span
                className="text-gray-600 text-xs"
                style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
              >
                checked in at
              </span>
            </div>

            {/* Venue */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg drop-shadow">{category?.icon || '📍'}</span>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-bold text-gray-900 truncate text-sm"
                  style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
                >
                  {checkin.venue?.name}
                </h3>
                {checkin.venue?.verified && (
                  <span className="text-blue-600 text-xs">✓ Verified</span>
                )}
              </div>
            </div>

            {/* Comment */}
            {checkin.comment && (
              <p
                className="text-gray-800 mb-2 text-sm"
                style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
              >
                {checkin.comment}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center flex-wrap gap-2 text-[10px] text-gray-600">
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-b from-gray-100 to-gray-200 rounded border border-gray-300 shadow-sm">
                <MapPin size={10} />
                {category?.name || 'Other'}
              </span>
              {distanceText && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-b from-blue-50 to-blue-100 rounded border border-blue-200 shadow-sm text-blue-700">
                  <Navigation size={10} />
                  {distanceText}
                </span>
              )}
              <span style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>{timeAgo}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() =>
                  onReply(
                    checkin.id,
                    checkin.user?.username || 'Anonymous',
                    checkin.venue?.name || 'Unknown'
                  )
                }
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
              >
                <Reply size={12} />
                Reply
              </button>

              {/* Reply Count Toggle */}
              {replyCount > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  {loadingReplies ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <MessageCircle size={12} />
                  )}
                  {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                  {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replies Section - Accordion */}
      {showReplies && (
        <div className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200">
          {loadingReplies ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={20} className="animate-spin text-gray-500" />
              <span className="ml-2 text-sm text-gray-500">Loading replies...</span>
            </div>
          ) : replies.length === 0 ? (
            <div className="py-3 px-4 text-center text-sm text-gray-500">No replies yet</div>
          ) : (
            replies.map((reply, index) => {
              const replyTimeAgo = formatDistanceToNow(new Date(reply.created_at), {
                addSuffix: true,
              });
              return (
                <div
                  key={reply.id}
                  className={`flex gap-2 p-3 pl-6 relative ${
                    index !== replies.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  {/* Reply thread line */}
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-300" />
                  <div className="absolute left-3 top-6 w-2 h-0.5 bg-gray-300" />

                  <img
                    src={
                      reply.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.username}`
                    }
                    alt={reply.username}
                    className="w-8 h-8 rounded-full flex-shrink-0 border border-gray-300 ml-2"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{reply.username}</span>
                      <span className="text-[10px] text-gray-500">{replyTimeAgo}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">{reply.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
