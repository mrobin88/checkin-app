import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  Search,
  UserPlus,
  UserMinus,
  Check,
  X,
  Loader2,
  Clock,
  Send,
} from 'lucide-react';
import { User, UserProfile, FriendRequest, DEFAULT_FRIEND } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '../lib/friends';

interface FriendsPageProps {
  onClose: () => void;
}

type Tab = 'friends' | 'requests' | 'search';

export default function FriendsPage({ onClose }: FriendsPageProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<User[]>([DEFAULT_FRIEND]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Load friends and requests
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      
      const [friendsList, pending, sent] = await Promise.all([
        getFriends(user.id),
        getPendingRequests(user.id),
        getSentRequests(user.id),
      ]);
      
      // Always include default friend
      setFriends([DEFAULT_FRIEND, ...friendsList.filter((f) => f.id !== DEFAULT_FRIEND.id)]);
      setPendingRequests(pending);
      setSentRequests(sent);
      setLoading(false);
    };

    loadData();
  }, [user?.id]);

  // Search users
  useEffect(() => {
    if (!user?.id || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      setSearchLoading(true);
      const results = await searchUsers(searchQuery, user.id);
      setSearchResults(results);
      setSearchLoading(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, user?.id]);

  const handleSendRequest = async (toUser: UserProfile) => {
    if (!user?.id) return;
    
    setProcessingIds((prev) => new Set(prev).add(toUser.id));
    
    const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const avatarUrl = user.user_metadata?.avatar_url;
    
    const result = await sendFriendRequest(user.id, toUser.id, username, avatarUrl);
    
    if (result.success) {
      // Update search results to show pending
      setSearchResults((prev) =>
        prev.map((u) => (u.id === toUser.id ? { ...u, has_pending_request: true } : u))
      );
      // Refresh sent requests
      const sent = await getSentRequests(user.id);
      setSentRequests(sent);
    }
    
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(toUser.id);
      return next;
    });
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!user?.id || !request.from_user) return;
    
    setProcessingIds((prev) => new Set(prev).add(request.id));
    
    const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const avatarUrl = user.user_metadata?.avatar_url;
    
    const result = await acceptFriendRequest(
      request.id,
      user.id,
      request.from_user_id,
      username,
      avatarUrl
    );
    
    if (result.success) {
      // Remove from pending, add to friends
      setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
      setFriends((prev) => [
        DEFAULT_FRIEND,
        request.from_user!,
        ...prev.filter((f) => f.id !== DEFAULT_FRIEND.id && f.id !== request.from_user!.id),
      ]);
    }
    
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(request.id);
      return next;
    });
  };

  const handleDeclineRequest = async (request: FriendRequest) => {
    if (!user?.id) return;
    
    setProcessingIds((prev) => new Set(prev).add(request.id));
    
    const result = await declineFriendRequest(request.id, user.id);
    
    if (result.success) {
      setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
    }
    
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(request.id);
      return next;
    });
  };

  const handleRemoveFriend = async (friend: User) => {
    if (!user?.id || friend.id === DEFAULT_FRIEND.id) return;
    
    if (!confirm(`Remove ${friend.username} from friends?`)) return;
    
    setProcessingIds((prev) => new Set(prev).add(friend.id));
    
    const result = await removeFriend(user.id, friend.id);
    
    if (result.success) {
      setFriends((prev) => prev.filter((f) => f.id !== friend.id));
    }
    
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(friend.id);
      return next;
    });
  };

  const pendingCount = pendingRequests.length;

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
            <Users size={20} />
            Friends
          </h1>
          <div className="w-14" />
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 px-4 pt-4">
        <div className="flex bg-white rounded-xl shadow border border-gray-300 p-1">
          {[
            { id: 'friends', label: 'Friends', count: friends.length },
            { id: 'requests', label: 'Requests', count: pendingCount },
            { id: 'search', label: 'Find', count: 0 },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-b from-[#5ba4e5] to-[#3b7fc4] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                {tab.count > 0 && tab.id !== 'friends' && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20' : 'bg-red-500 text-white'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={32} className="animate-spin text-gray-500" />
          </div>
        ) : (
          <>
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <>
                <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
                  <div className="p-3 border-b border-gray-200 bg-gray-50">
                    <p className="text-sm font-bold text-gray-700">
                      {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
                    </p>
                  </div>
                  {friends.map((friend, index) => {
                    const isDefault = friend.id === DEFAULT_FRIEND.id;
                    const isProcessing = processingIds.has(friend.id);
                    return (
                      <div
                        key={friend.id}
                        className={`flex items-center gap-3 p-4 ${
                          index !== friends.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <img
                          src={
                            friend.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`
                          }
                          alt={friend.username}
                          className={`w-12 h-12 rounded-full border-2 ${
                            isDefault ? 'border-blue-400' : 'border-gray-300'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900">{friend.username}</p>
                          {isDefault && (
                            <p className="text-xs text-blue-600">✓ CheckIn Team</p>
                          )}
                        </div>
                        {!isDefault && (
                          <button
                            onClick={() => handleRemoveFriend(friend)}
                            disabled={isProcessing}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            {isProcessing ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <UserMinus size={18} />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tom's Welcome */}
                <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <img
                      src={DEFAULT_FRIEND.avatar_url}
                      alt={DEFAULT_FRIEND.username}
                      className="w-10 h-10 rounded-full border-2 border-blue-300"
                    />
                    <div>
                      <p className="font-medium text-blue-900">Welcome to CheckIn! 👋</p>
                      <p className="text-sm text-blue-700 mt-1">
                        I'm {DEFAULT_FRIEND.username}, and I'm your first friend! Add more friends to see their check-ins in your feed.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <>
                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                  <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                      <p className="text-sm font-bold text-gray-700">
                        {pendingRequests.length} pending {pendingRequests.length === 1 ? 'request' : 'requests'}
                      </p>
                    </div>
                    {pendingRequests.map((request, index) => {
                      const isProcessing = processingIds.has(request.id);
                      const timeAgo = formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                      });
                      return (
                        <div
                          key={request.id}
                          className={`p-4 ${
                            index !== pendingRequests.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                request.from_user?.avatar_url ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.from_user?.username}`
                              }
                              alt={request.from_user?.username}
                              className="w-12 h-12 rounded-full border-2 border-gray-300"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900">
                                {request.from_user?.username}
                              </p>
                              <p className="text-xs text-gray-500">{timeAgo}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleAcceptRequest(request)}
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
                              onClick={() => handleDeclineRequest(request)}
                              disabled={isProcessing}
                              className="flex-1 flex items-center justify-center gap-1 py-2 bg-gradient-to-b from-gray-200 to-gray-300 text-gray-700 font-bold text-sm rounded-lg shadow border border-gray-400 disabled:opacity-50"
                            >
                              <X size={14} />
                              Decline
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Sent Requests */}
                {sentRequests.length > 0 && (
                  <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
                    <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                      <Send size={14} className="text-gray-500" />
                      <p className="text-sm font-bold text-gray-700">Sent requests</p>
                    </div>
                    {sentRequests.map((request, index) => {
                      const timeAgo = formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                      });
                      return (
                        <div
                          key={request.id}
                          className={`flex items-center gap-3 p-4 ${
                            index !== sentRequests.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <img
                            src={
                              request.to_user?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.to_user?.username}`
                            }
                            alt={request.to_user?.username}
                            className="w-10 h-10 rounded-full border-2 border-gray-300"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{request.to_user?.username}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={10} />
                              Pending • {timeAgo}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {pendingRequests.length === 0 && sentRequests.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users size={48} className="text-gray-400 mb-3" />
                    <p className="text-gray-700 font-bold">No pending requests</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Search for friends to connect with them
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <>
                {/* Search Input */}
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>

                {/* Search Results */}
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-gray-500" />
                  </div>
                ) : searchQuery.length < 2 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Search size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Type at least 2 characters to search</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No users found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
                    {searchResults.map((result, index) => {
                      const isProcessing = processingIds.has(result.id);
                      return (
                        <div
                          key={result.id}
                          className={`flex items-center gap-3 p-4 ${
                            index !== searchResults.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <img
                            src={
                              result.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.username}`
                            }
                            alt={result.username}
                            className="w-12 h-12 rounded-full border-2 border-gray-300"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900">{result.username}</p>
                            {result.is_friend && (
                              <p className="text-xs text-green-600">✓ Already friends</p>
                            )}
                            {result.has_pending_request && (
                              <p className="text-xs text-yellow-600">Request pending</p>
                            )}
                          </div>
                          {!result.is_friend && !result.has_pending_request && (
                            <button
                              onClick={() => handleSendRequest(result)}
                              disabled={isProcessing}
                              className="flex items-center gap-1 px-3 py-2 bg-gradient-to-b from-[#5ba4e5] to-[#3b7fc4] text-white font-bold text-sm rounded-lg shadow border border-[#2d5f9f] disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <UserPlus size={14} />
                              )}
                              Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

