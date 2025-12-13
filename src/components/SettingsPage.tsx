import { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  Shield,
  User,
  LogOut,
  ChevronRight,
  Smartphone,
  MapPin,
  Users,
  TrendingUp,
  MessageCircle,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Loader2,
  Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserSettings, DEFAULT_USER_SETTINGS } from '../types';
import {
  getUserSettings,
  updateUserSettings,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isPushSupported,
  getNotificationPermission,
} from '../lib/notifications';

interface SettingsPageProps {
  onClose: () => void;
}

type SettingsSection = 'main' | 'notifications' | 'privacy' | 'account';

export default function SettingsPage({ onClose }: SettingsPageProps) {
  const { user, signOut } = useAuth();
  const [section, setSection] = useState<SettingsSection>('main');
  const [settings, setSettings] = useState<UserSettings>({ ...DEFAULT_USER_SETTINGS, user_id: user?.id || '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load settings
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const loadSettings = async () => {
      const userSettings = await getUserSettings(user.id);
      setSettings(userSettings);
      setNotificationPermission(getNotificationPermission());
      setLoading(false);
    };

    loadSettings();
  }, [user?.id]);

  const handleSettingChange = async (key: keyof UserSettings, value: boolean | string) => {
    if (!user?.id) return;

    setSaving(true);
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    await updateUserSettings({ user_id: user.id, [key]: value });
    setSaving(false);
  };

  const handleEnablePush = async () => {
    if (!user?.id) return;

    setSaving(true);
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      await subscribeToPush(user.id);
      await handleSettingChange('push_enabled', true);
    }
    setSaving(false);
  };

  const handleDisablePush = async () => {
    await unsubscribeFromPush();
    await handleSettingChange('push_enabled', false);
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleDeleteAccount = async () => {
    // In production, this would call a backend endpoint to handle account deletion
    alert('Account deletion would be processed here. Contact support for now.');
    setShowDeleteConfirm(false);
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest';
  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;

  const renderToggle = (
    enabled: boolean,
    onChange: () => void,
    disabled?: boolean
  ) => (
    <button
      onClick={onChange}
      disabled={disabled || saving}
      className={`w-12 h-7 rounded-full transition-all duration-200 relative ${
        enabled
          ? 'bg-gradient-to-b from-green-400 to-green-500 border border-green-600'
          : 'bg-gradient-to-b from-gray-300 to-gray-400 border border-gray-500'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-all duration-200 ${
          enabled ? 'right-0.5' : 'left-0.5'
        }`}
      />
    </button>
  );

  // Main menu
  if (section === 'main') {
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
              <Settings size={20} />
              Settings
            </h1>
            <div className="w-14" />
          </div>
        </header>

        {/* Profile Card */}
        <div className="flex-shrink-0 px-4 py-4">
          <div className="bg-white rounded-xl shadow border border-gray-300 p-4 flex items-center gap-4">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-16 h-16 rounded-full border-2 border-gray-300"
            />
            <div className="flex-1">
              <h2 className="font-bold text-gray-900">{displayName}</h2>
              <p className="text-sm text-gray-600">{user?.email || 'Guest User'}</p>
            </div>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
            {/* Notifications */}
            <button
              onClick={() => setSection('notifications')}
              className="w-full flex items-center gap-4 p-4 border-b border-gray-200 active:bg-gray-50"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-red-100 to-red-200 flex items-center justify-center">
                <Bell size={20} className="text-red-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">Notifications</p>
                <p className="text-xs text-gray-500">Push alerts, sounds, badges</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>

            {/* Privacy */}
            <button
              onClick={() => setSection('privacy')}
              className="w-full flex items-center gap-4 p-4 border-b border-gray-200 active:bg-gray-50"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center">
                <Shield size={20} className="text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">Privacy</p>
                <p className="text-xs text-gray-500">Who can see your activity</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>

            {/* Account */}
            <button
              onClick={() => setSection('account')}
              className="w-full flex items-center gap-4 p-4 active:bg-gray-50"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-purple-100 to-purple-200 flex items-center justify-center">
                <User size={20} className="text-purple-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">Account</p>
                <p className="text-xs text-gray-500">Sign out, delete account</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>

          {/* App Info */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>CheckIn v1.0.0</p>
            <p className="mt-1">Made with ❤️ for explorers</p>
          </div>
        </div>
      </div>
    );
  }

  // Notifications section
  if (section === 'notifications') {
    return (
      <div className="fixed inset-0 bg-[#c5ccd4] z-50 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 bg-gradient-to-b from-[#6d84a3] via-[#5a7493] to-[#4d6580] border-b-2 border-gray-800 px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSection('main')}
              className="text-white font-medium text-sm"
              style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.5)' }}
            >
              ← Settings
            </button>
            <h1
              className="text-lg font-bold text-white"
              style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.5)' }}
            >
              Notifications
            </h1>
            <div className="w-16" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={32} className="animate-spin text-gray-500" />
            </div>
          ) : (
            <>
              {/* Push Notifications */}
              <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone size={20} className="text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Push Notifications</p>
                        <p className="text-xs text-gray-500">
                          {notificationPermission === 'granted'
                            ? 'Enabled'
                            : notificationPermission === 'denied'
                            ? 'Blocked by browser'
                            : 'Not enabled'}
                        </p>
                      </div>
                    </div>
                    {isPushSupported() && notificationPermission !== 'denied' && (
                      renderToggle(
                        settings.push_enabled && notificationPermission === 'granted',
                        settings.push_enabled ? handleDisablePush : handleEnablePush
                      )
                    )}
                  </div>
                  {notificationPermission === 'denied' && (
                    <p className="text-xs text-red-600 mt-2">
                      Notifications are blocked. Enable them in your browser settings.
                    </p>
                  )}
                </div>
              </div>

              {/* Notification Types */}
              <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <p className="font-bold text-gray-900 text-sm">Notify me about</p>
                </div>

                {/* Friend Requests */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Users size={18} className="text-gray-500" />
                    <span className="text-gray-900">Friend requests</span>
                  </div>
                  {renderToggle(
                    settings.friend_request_notifications,
                    () => handleSettingChange('friend_request_notifications', !settings.friend_request_notifications)
                  )}
                </div>

                {/* Friend Check-ins */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-gray-500" />
                    <span className="text-gray-900">Friend check-ins</span>
                  </div>
                  {renderToggle(
                    settings.friend_checkin_notifications,
                    () => handleSettingChange('friend_checkin_notifications', !settings.friend_checkin_notifications)
                  )}
                </div>

                {/* Trending Spots */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={18} className="text-gray-500" />
                    <span className="text-gray-900">Trending spots nearby</span>
                  </div>
                  {renderToggle(
                    settings.trending_notifications,
                    () => handleSettingChange('trending_notifications', !settings.trending_notifications)
                  )}
                </div>

                {/* Replies */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <MessageCircle size={18} className="text-gray-500" />
                    <span className="text-gray-900">Replies to check-ins</span>
                  </div>
                  {renderToggle(
                    settings.reply_notifications,
                    () => handleSettingChange('reply_notifications', !settings.reply_notifications)
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Privacy section
  if (section === 'privacy') {
    return (
      <div className="fixed inset-0 bg-[#c5ccd4] z-50 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 bg-gradient-to-b from-[#6d84a3] via-[#5a7493] to-[#4d6580] border-b-2 border-gray-800 px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSection('main')}
              className="text-white font-medium text-sm"
              style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.5)' }}
            >
              ← Settings
            </button>
            <h1
              className="text-lg font-bold text-white"
              style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.5)' }}
            >
              Privacy
            </h1>
            <div className="w-16" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Privacy Mode */}
          <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <p className="font-bold text-gray-900 text-sm">Who can see my check-ins</p>
            </div>
            {[
              { id: 'public', label: 'Everyone', desc: 'Anyone can see your activity', icon: Eye },
              { id: 'friends_only', label: 'Friends Only', desc: 'Only friends see your activity', icon: Users },
              { id: 'private', label: 'Private', desc: 'Only you see your activity', icon: EyeOff },
            ].map((option) => {
              const Icon = option.icon;
              const isSelected = settings.privacy_mode === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSettingChange('privacy_mode', option.id)}
                  className={`w-full flex items-center gap-4 p-4 border-b border-gray-100 last:border-0 ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  <Icon size={20} className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500">{option.desc}</p>
                  </div>
                  {isSelected && <Check size={20} className="text-blue-600" />}
                </button>
              );
            })}
          </div>

          {/* Other Privacy Options */}
          <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-gray-500" />
                <div>
                  <span className="text-gray-900">Show on map</span>
                  <p className="text-xs text-gray-500">Let others see where you are</p>
                </div>
              </div>
              {renderToggle(
                settings.show_on_map,
                () => handleSettingChange('show_on_map', !settings.show_on_map)
              )}
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Eye size={18} className="text-gray-500" />
                <div>
                  <span className="text-gray-900">Show check-in history</span>
                  <p className="text-xs text-gray-500">Display past check-ins on profile</p>
                </div>
              </div>
              {renderToggle(
                settings.show_checkin_history,
                () => handleSettingChange('show_checkin_history', !settings.show_checkin_history)
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Account section
  return (
    <div className="fixed inset-0 bg-[#c5ccd4] z-50 flex flex-col overflow-hidden">
      <header className="flex-shrink-0 bg-gradient-to-b from-[#6d84a3] via-[#5a7493] to-[#4d6580] border-b-2 border-gray-800 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSection('main')}
            className="text-white font-medium text-sm"
            style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.5)' }}
          >
            ← Settings
          </button>
          <h1
            className="text-lg font-bold text-white"
            style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.5)' }}
          >
            Account
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Account Actions */}
        <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">
          {/* Download Data */}
          <button className="w-full flex items-center gap-4 p-4 border-b border-gray-200 active:bg-gray-50">
            <Download size={20} className="text-gray-600" />
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Download my data</p>
              <p className="text-xs text-gray-500">Get a copy of your check-ins</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 p-4 active:bg-gray-50"
          >
            <LogOut size={20} className="text-gray-600" />
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Sign out</p>
              <p className="text-xs text-gray-500">Sign out of your account</p>
            </div>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow border border-red-200 overflow-hidden">
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="font-bold text-red-800 text-sm">Danger Zone</p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-4 p-4 active:bg-red-50"
          >
            <Trash2 size={20} className="text-red-600" />
            <div className="flex-1 text-left">
              <p className="font-medium text-red-700">Delete account</p>
              <p className="text-xs text-red-500">Permanently delete your account and data</p>
            </div>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account?</h3>
              <p className="text-gray-600">
                This will permanently delete your account, check-ins, and all data. This cannot be
                undone.
              </p>
            </div>
            <div className="flex border-t border-gray-200">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-4 font-medium text-gray-700 border-r border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-4 font-medium text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

