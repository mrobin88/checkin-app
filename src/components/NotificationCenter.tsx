import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  X,
  UserPlus,
  UserCheck,
  MapPin,
  MessageCircle,
  TrendingUp,
  Check,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import { Notification } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
} from '../lib/notifications';
import { acceptFriendRequest, declineFriendRequest } from '../lib/friends';

interface NotificationCenterProps {
  onClose: () => void;
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  reply: MessageCircle,
  mention: MessageCircle,
  friend_request: UserPlus,
  friend_accepted: UserCheck,
  trending_spot: TrendingUp,
  friend_checkin: MapPin,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  reply: 'from-blue-100 to-blue-200 border-blue-300 text-blue-700',
  mention: 'from-purple-100 to-purple-200 border-purple-300 text-purple-700',
  friend_request: 'from-green-100 to-green-200 border-green-300 text-green-700',
  friend_accepted: 'from-emerald-100 to-emerald-200 border-emerald-300 text-emerald-700',
  trending_spot: 'from-orange-100 to-orange-200 border-orange-300 text-orange-700',
  friend_checkin: 'from-cyan-100 to-cyan-200 border-cyan-300 text-cyan-700',
};

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Fetch notifications
  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifications(data as Notification[]);
      }
      setLoading(false);
    };

    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    await markAllNotificationsAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleAcceptFriend = async (notification: Notification) => {
    if (!user?.id) return;
    
    setProcessingIds((prev) => new Set(prev).add(notification.id));
    
    // Find the friend request
    const { data: request } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('from_user_id', notification.from_user_id)
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .single();
      
    if (request) {
      const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const avatarUrl = user.user_metadata?.avatar_url;
      
      await acceptFriendRequest(request.id, user.id, notification.from_user_id, username, avatarUrl);
      await markNotificationAsRead(notification.id);
      
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, is_read: true, content: `You are now friends with ${notification.from_username}!` }
            : n
        )
      );
    }
    
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(notification.id);
      return next;
    });
  };

  const handleDeclineFriend = async (notification: Notification) => {
    if (!user?.id) return;
    
    setProcessingIds((prev) => new Set(prev).add(notification.id));
    
    const { data: request } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('from_user_id', notification.from_user_id)
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .single();
      
    if (request) {
      await declineFriendRequest(request.id, user.id);
      await markNotificationAsRead(notification.id);
      
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }
    
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(notification.id);
      return next;
    });
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="fixed inset-0 bg-[#c5ccd4] z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-gradient-to-b from-[#6d84a3] via-[#5a7493] to-[#4d6580] border-b-2 border-gray-800 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-white font-medium text-sm"
            style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.5)' }}
          >
            ← Back
          </button>
          <h1
            className="text-lg font-bold text-white flex items-center gap-2"
            style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.5)' }}
          >
            <Bell size={20} />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <button
            onClick={handleMarkAllAsRead}
            className="p-2 bg-gradient-to-b from-gray-200 to-gray-300 rounded-lg shadow-md border border-gray-400"
            title="Mark all as read"
          >
            <CheckCheck size={16} className="text-gray-700" />
          </button>
        </div>
      </header>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={32} className="animate-spin text-gray-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bell size={48} className="text-gray-400 mb-3" />
            <p className="text-gray-700 font-bold">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-1">
              When you get friend requests or activity, they'll appear here
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.notification_type] || Bell;
            const colorClass = NOTIFICATION_COLORS[notification.notification_type] || 'from-gray-100 to-gray-200 border-gray-300 text-gray-700';
            const isProcessing = processingIds.has(notification.id);
            const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
            });

            return (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow border border-gray-300 overflow-hidden transition-all ${
                  !notification.is_read ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                }`}
                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
              >
                <div className="p-4">
                  <div className="flex gap-3">
                    {/* Icon/Avatar */}
                    <div className="flex-shrink-0">
                      {notification.from_avatar_url ? (
                        <img
                          src={notification.from_avatar_url}
                          alt={notification.from_username}
                          className="w-12 h-12 rounded-full border-2 border-gray-300"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-b ${colorClass} border`}
                        >
                          <Icon size={20} />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{notification.content}</p>
                          {notification.venue_name && (
                            <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1">
                              <MapPin size={12} />
                              {notification.venue_name}
                            </p>
                          )}
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>

                      {/* Friend Request Actions */}
                      {notification.notification_type === 'friend_request' && !notification.is_read && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptFriend(notification);
                            }}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-gradient-to-b from-green-500 to-green-600 text-white font-bold text-sm rounded-lg shadow border border-green-700 disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeclineFriend(notification);
                            }}
                            disabled={isProcessing}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-gradient-to-b from-gray-200 to-gray-300 text-gray-700 font-bold text-sm rounded-lg shadow border border-gray-400 disabled:opacity-50"
                          >
                            <X size={14} />
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Notification Badge component for Header
export function NotificationBadge({ onClick }: { onClick: () => void }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    // Get initial count
    getUnreadCount(user.id).then(setUnreadCount);

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notification-badge')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refresh count on any change
          getUnreadCount(user.id).then(setUnreadCount);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return (
    <button
      onClick={onClick}
      className="relative p-2 bg-gradient-to-b from-gray-200 to-gray-300 rounded-lg shadow-md border border-gray-400 active:shadow-inner transition-all"
    >
      <Bell size={18} className="text-gray-700" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

