import { useState } from 'react';
import {
  MapPin,
  Users,
  Flame,
  Star,
  Settings,
  ChevronRight,
  LogOut,
  Award,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { DEFAULT_FRIEND } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ProfilePageProps {
  onClose: () => void;
}

export default function ProfilePage({ onClose }: ProfilePageProps) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'friends' | 'achievements'>('stats');

  // Mock data - would come from Supabase in production
  const stats = {
    checkins: 47,
    places: 23,
    friends: 12,
    streak: 5,
    points: 1250,
    mayorships: 3,
  };

  const friends = [
    DEFAULT_FRIEND, // Tom from MySpace equivalent - always first!
    // More friends would be fetched from Supabase
  ];

  const achievements = [
    { id: '1', name: 'First Check-in', icon: '🎉', earned: true, description: 'Check in for the first time' },
    { id: '2', name: 'Coffee Lover', icon: '☕', earned: true, description: 'Visit 5 coffee shops' },
    { id: '3', name: 'Streak Starter', icon: '🔥', earned: true, description: 'Get a 3-day streak' },
    { id: '4', name: 'Explorer', icon: '🗺️', earned: false, description: 'Visit 50 unique places' },
    { id: '5', name: 'Social Butterfly', icon: '🦋', earned: false, description: 'Make 10 friends' },
    { id: '6', name: 'Mayor', icon: '👑', earned: false, description: 'Become mayor of a venue' },
  ];

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous';
  const avatarUrl = user?.user_metadata?.avatar_url || 
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

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
            className="text-lg font-bold text-white"
            style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.5)' }}
          >
            Profile
          </h1>
          <button
            onClick={handleSignOut}
            className="p-2 bg-gradient-to-b from-gray-200 to-gray-300 rounded-lg shadow-md border border-gray-400"
          >
            <LogOut size={16} className="text-gray-700" />
          </button>
        </div>
      </header>

      {/* Profile Card */}
      <div className="flex-shrink-0 px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-300 p-6">
          <div className="flex items-center gap-4">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-20 h-20 rounded-full border-4 border-[#5ba4e5] shadow-lg"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
              <p className="text-sm text-gray-600">{user?.email || 'Guest User'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="flex items-center gap-1 text-xs bg-gradient-to-b from-orange-100 to-orange-200 text-orange-700 px-2 py-1 rounded-full border border-orange-300">
                  <Flame size={12} />
                  {stats.streak} day streak
                </span>
                <span className="flex items-center gap-1 text-xs bg-gradient-to-b from-yellow-100 to-yellow-200 text-yellow-700 px-2 py-1 rounded-full border border-yellow-300">
                  <Star size={12} />
                  {stats.points} pts
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="text-center p-3 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <p className="text-2xl font-bold text-gray-900">{stats.checkins}</p>
              <p className="text-xs text-gray-600">Check-ins</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <p className="text-2xl font-bold text-gray-900">{stats.places}</p>
              <p className="text-xs text-gray-600">Places</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <p className="text-2xl font-bold text-gray-900">{stats.friends}</p>
              <p className="text-xs text-gray-600">Friends</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 px-4">
        <div className="flex bg-white rounded-xl shadow border border-gray-300 p-1">
          {[
            { id: 'stats', label: 'Stats', icon: TrendingUp },
            { id: 'friends', label: 'Friends', icon: Users },
            { id: 'achievements', label: 'Badges', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-b from-[#5ba4e5] to-[#3b7fc4] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === 'stats' && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">This Week</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-b from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                      <MapPin size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Check-ins</p>
                      <p className="text-xs text-gray-500">This week</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">12</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-b from-green-100 to-green-200 rounded-full flex items-center justify-center">
                      <Calendar size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Current Streak</p>
                      <p className="text-xs text-gray-500">Days in a row</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-orange-500">🔥 {stats.streak}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-b from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                      <Award size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Mayorships</p>
                      <p className="text-xs text-gray-500">Venues you rule</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900">👑 {stats.mayorships}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="space-y-3">
            {/* Add Friends Button */}
            <button className="w-full bg-gradient-to-b from-[#5ba4e5] to-[#3b7fc4] text-white font-bold py-3 rounded-xl shadow-md border border-[#2d5f9f] flex items-center justify-center gap-2">
              <Users size={18} />
              Find Friends
            </button>

            {/* Friends List */}
            <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Friends</h3>
                <span className="text-xs text-gray-500">{friends.length} friends</span>
              </div>
              {friends.map((friend, index) => (
                <div
                  key={friend.id}
                  className={`flex items-center gap-3 p-4 ${
                    index !== friends.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <img
                    src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                    alt={friend.username}
                    className="w-12 h-12 rounded-full border-2 border-gray-300"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{friend.username}</p>
                    {friend.id === DEFAULT_FRIEND.id && (
                      <p className="text-xs text-blue-600">✓ CheckIn Team</p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              ))}
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
                    I'm {DEFAULT_FRIEND.username}, and I'm your first friend! Check in at cool places and 
                    I'll see you around. Happy exploring!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-xl border ${
                  achievement.earned
                    ? 'bg-white border-gray-300 shadow'
                    : 'bg-gray-100 border-gray-200 opacity-60'
                }`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <p className={`font-bold text-sm ${achievement.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                  {achievement.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
                {achievement.earned && (
                  <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    ✓ Earned
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Button */}
      <div className="flex-shrink-0 p-4 border-t border-gray-300 bg-white">
        <button className="w-full flex items-center justify-between p-4 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl border border-gray-300">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-gray-600" />
            <span className="font-medium text-gray-900">Settings</span>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}

