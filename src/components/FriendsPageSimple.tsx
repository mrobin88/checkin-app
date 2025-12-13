import { useState, useEffect } from 'react';
import { Search, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface FriendsPageSimpleProps {
  onClose: () => void;
}

export default function FriendsPageSimple({ onClose }: FriendsPageSimpleProps) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Load friends
  useEffect(() => {
    if (!user?.id) return;
    
    const loadFriends = async () => {
      const { data } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id);
      
      if (data && data.length > 0) {
        const friendIds = data.map(f => f.friend_id);
        const { data: friendsData } = await supabase
          .from('users')
          .select('*')
          .in('id', friendIds);
        
        setFriends(friendsData || []);
      }
      setLoading(false);
    };
    
    loadFriends();
  }, [user?.id]);

  // Search users
  useEffect(() => {
    if (!user?.id || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const search = async () => {
      setSearching(true);
      const { data } = await supabase
        .from('users')
        .select('*')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', user.id)
        .limit(20);
      
      setSearchResults(data || []);
      setSearching(false);
    };
    
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const addFriend = async (friendId: string) => {
    if (!user?.id) return;
    
    // Add bidirectional friendship
    await supabase.from('friendships').insert([
      { user_id: user.id, friend_id: friendId },
      { user_id: friendId, friend_id: user.id },
    ]);
    
    // Refresh friends
    const newFriend = searchResults.find(u => u.id === friendId);
    if (newFriend) setFriends([...friends, newFriend]);
    setSearchQuery('');
  };

  const removeFriend = async (friendId: string) => {
    if (!user?.id || !confirm('Remove this friend?')) return;
    
    // Remove bidirectional friendship
    await supabase.from('friendships').delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);
    
    setFriends(friends.filter(f => f.id !== friendId));
  };

  const isFriend = (userId: string) => friends.some(f => f.id === userId);

  return (
    <div className="fixed inset-0 bg-[#c5ccd4] z-50 flex flex-col">
      <header className="bg-gradient-to-b from-[#6d84a3] to-[#4d6580] border-b-2 border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-white font-medium text-sm">← Back</button>
          <h1 className="text-lg font-bold text-white">Friends</h1>
          <div className="w-14" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-300 shadow"
          />
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-bold text-gray-700">Search Results</p>
            </div>
            {searching ? (
              <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No users found</div>
            ) : (
              searchResults.map(result => (
                <div key={result.id} className="flex items-center gap-3 p-4 border-b border-gray-100">
                  <img
                    src={result.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.username}`}
                    alt={result.username}
                    className="w-10 h-10 rounded-full border-2 border-gray-300"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{result.username}</p>
                    {isFriend(result.id) && <p className="text-xs text-green-600">✓ Friend</p>}
                  </div>
                  {!isFriend(result.id) && (
                    <button
                      onClick={() => addFriend(result.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg"
                    >
                      <UserPlus size={14} /> Add
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Friends List */}
        <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm font-bold text-gray-700">{friends.length} Friends</p>
          </div>
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
          ) : friends.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No friends yet. Search above!</div>
          ) : (
            friends.map(friend => (
              <div key={friend.id} className="flex items-center gap-3 p-4 border-b border-gray-100">
                <img
                  src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                  alt={friend.username}
                  className="w-12 h-12 rounded-full border-2 border-gray-300"
                />
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{friend.username}</p>
                </div>
                <button
                  onClick={() => removeFriend(friend.id)}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <UserMinus size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

