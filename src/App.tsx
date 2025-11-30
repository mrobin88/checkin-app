import { useState, useEffect } from 'react';
import Map from './components/Map';
import Header from './components/Header';
import CheckInModal from './components/CheckInModal';
import ActivityFeed from './components/ActivityFeed';
import VenueList from './components/VenueList';
import AuthModal from './components/AuthModal';
import ReplyModal from './components/ReplyModal';
import ProfilePage from './components/ProfilePage';
import { useGeolocation } from './hooks/useGeolocation';
import { useAuth } from './contexts/AuthContext';
import { Venue, CheckIn, Message, Notification as NotificationType } from './types';
import { supabase } from './lib/supabase';
import { fetchNearbyVenues as fetchOverpassVenues } from './lib/overpass';
import { encode as encodeGeohash } from './lib/geohash';
import { MapPin, Activity } from 'lucide-react';

function App() {
  const { location, error: locationError } = useGeolocation();
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [replyTo, setReplyTo] = useState<{
    id: string;
    username: string;
    venueName: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'feed'>('map');
  const [loading, setLoading] = useState(true);

  // Fetch nearby venues
  useEffect(() => {
    if (location) {
      fetchNearbyVenues(location.lat, location.lng);
    }
  }, [location]);

  // Load messages from Supabase (with localStorage fallback)
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // Try to fetch from Supabase - only parent messages (not replies)
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('is_deleted', false)
          .is('parent_message_id', null) // Only get top-level messages, not replies
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data && data.length > 0) {
          // Convert messages to CheckIn format for display
          const formattedCheckins: CheckIn[] = data.map((msg: Message) => ({
            id: msg.id,
            user_id: msg.user_id,
            venue_id: msg.venue_id,
            comment: msg.content,
            checked_in_at: msg.created_at,
            geohash: msg.geohash,
            reply_count: msg.reply_count || 0, // Include reply count
            user: {
              id: msg.user_id,
              username: msg.username,
              avatar_url: msg.avatar_url,
              created_at: msg.created_at,
            },
            venue: {
              id: msg.venue_id,
              name: msg.venue_name,
              category: msg.venue_category || 'other',
              lat: msg.venue_lat || 0,
              lng: msg.venue_lng || 0,
              address: msg.venue_address || '',
              created_by: '',
              verified: false,
              geohash: msg.geohash,
              created_at: msg.created_at,
            },
          }));
          setCheckins(formattedCheckins);
          console.log(`Loaded ${formattedCheckins.length} messages from Supabase`);
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem('checkins');
          if (stored) {
            const localCheckins = JSON.parse(stored);
            setCheckins(localCheckins);
            console.log('Loaded messages from localStorage (Supabase not available)');
          }
        }
      } catch (err) {
        console.error('Error loading messages:', err);
        // Fallback to localStorage
        const stored = localStorage.getItem('checkins');
        if (stored) {
          const localCheckins = JSON.parse(stored);
          setCheckins(localCheckins);
        }
      }
    };

    loadMessages();

    // Subscribe to real-time messages (only top-level check-ins, not replies)
    const messagesSubscription = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('New message received:', payload);
          const newMsg = payload.new as Message;

          // Only add to feed if it's a check-in, not a reply
          if (newMsg.parent_message_id) {
            console.log('Skipping reply, not adding to main feed');
            return;
          }

          // Convert to CheckIn format and add to state
          const newCheckin: CheckIn = {
            id: newMsg.id,
            user_id: newMsg.user_id,
            venue_id: newMsg.venue_id,
            comment: newMsg.content,
            checked_in_at: newMsg.created_at,
            geohash: newMsg.geohash,
            reply_count: 0,
            user: {
              id: newMsg.user_id,
              username: newMsg.username,
              avatar_url: newMsg.avatar_url,
              created_at: newMsg.created_at,
            },
            venue: {
              id: newMsg.venue_id,
              name: newMsg.venue_name,
              category: newMsg.venue_category || 'other',
              lat: newMsg.venue_lat || 0,
              lng: newMsg.venue_lng || 0,
              address: newMsg.venue_address || '',
              created_by: '',
              verified: false,
              geohash: newMsg.geohash,
              created_at: newMsg.created_at,
            },
          };

          setCheckins((current) => [newCheckin, ...current]);
        }
      )
      .subscribe();

    // Subscribe to notifications
    const notificationsSubscription = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: user ? `user_id=eq.${user.id}` : `user_id=eq.anonymous`,
        },
        (payload) => {
          const notification = payload.new as NotificationType;
          console.log('New notification:', notification);

          // Show browser alert
          if (Notification.permission === 'granted') {
            new Notification(`Reply from @${notification.from_username}`, {
              body: notification.content,
              icon: notification.from_avatar_url,
            });
          } else {
            alert(`💬 Reply from @${notification.from_username}:\n"${notification.content}"`);
          }
        }
      )
      .subscribe();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      messagesSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
    };
  }, [user]);

  const fetchNearbyVenues = async (lat: number, lng: number) => {
    try {
      setLoading(true);

      // Try fetching from OpenStreetMap first (real data!)
      const overpassVenues = await fetchOverpassVenues(lat, lng, 1000); // 5km radius for easier testing

      // Convert to our Venue format
      const venues: Venue[] = overpassVenues.map((v) => ({
        id: v.id,
        name: v.name,
        lat: v.lat,
        lng: v.lng,
        address: v.address || '',
        category: v.category,
        created_by: 'osm',
        verified: true, // OSM data is verified
        geohash: encodeGeohash(v.lat, v.lng, 8),
        created_at: new Date().toISOString(),
        checkin_count: 0, // Will be updated from Supabase if available
      }));

      setVenues(venues);
      console.log(`Found ${venues.length} real venues nearby!`);
    } catch (err) {
      console.error('Error fetching venues:', err);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVenueClick = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowCheckInModal(true);
  };

  const handleReply = (checkInId: string, originalUser: string, venueName: string) => {
    setReplyTo({ id: checkInId, username: originalUser, venueName });
    setShowReplyModal(true);
  };

  const handleSendReply = async (replyText: string) => {
    if (!location || !replyTo) return;

    const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous';
    const avatarUrl =
      user?.user_metadata?.avatar_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    // Find the original check-in to get venue info
    const originalCheckIn = checkins.find((c) => c.id === replyTo.id);
    if (!originalCheckIn) return;

    // Create reply message
    const reply: Omit<Message, 'id' | 'created_at'> = {
      venue_id: originalCheckIn.venue_id,
      venue_name: originalCheckIn.venue?.name || replyTo.venueName,
      venue_category: originalCheckIn.venue?.category,
      venue_lat: originalCheckIn.venue?.lat,
      venue_lng: originalCheckIn.venue?.lng,
      venue_address: originalCheckIn.venue?.address,
      user_id: user?.id || 'anonymous',
      username: username,
      avatar_url: avatarUrl,
      content: replyText,
      geohash: encodeGeohash(location.lat, location.lng, 6),
      parent_message_id: replyTo.id,
      is_deleted: false,
    };

    const { error } = await supabase.from('messages').insert(reply);

    if (error) {
      console.error('Error sending reply:', error);
      throw error;
    }

    console.log('✅ Reply sent!');
  };

  const handleCheckIn = async (venueId: string, comment?: string) => {
    if (!location || !selectedVenue) return;

    try {
      const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous';
      const avatarUrl =
        user?.user_metadata?.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

      // Create message object for Supabase
      const message: Omit<Message, 'id' | 'created_at'> = {
        venue_id: venueId,
        venue_name: selectedVenue.name,
        venue_category: selectedVenue.category,
        venue_lat: selectedVenue.lat,
        venue_lng: selectedVenue.lng,
        venue_address: selectedVenue.address,
        user_id: user?.id || 'anonymous',
        username: username,
        avatar_url: avatarUrl,
        content: comment || 'Checked in! 📍',
        geohash: encodeGeohash(location.lat, location.lng, 6),
        is_deleted: false,
      };

      // Try to save to Supabase first
      const { data: savedMessage, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) {
        console.warn('Supabase not available, saving to localStorage:', error.message);
        // Fallback to localStorage
        const checkIn: CheckIn = {
          id: crypto.randomUUID(),
          user_id: message.user_id,
          venue_id: message.venue_id,
          comment: message.content,
          checked_in_at: new Date().toISOString(),
          geohash: message.geohash,
          user: {
            id: message.user_id,
            username: message.username,
            avatar_url: message.avatar_url,
            created_at: new Date().toISOString(),
          },
          venue: selectedVenue,
        };

        const stored = localStorage.getItem('checkins');
        const existingCheckins = stored ? JSON.parse(stored) : [];
        existingCheckins.unshift(checkIn);
        localStorage.setItem('checkins', JSON.stringify(existingCheckins.slice(0, 100)));

        // Update state immediately
        setCheckins([checkIn, ...checkins]);
      } else {
        console.log('✅ Message saved to Supabase:', savedMessage);
        // Real-time subscription will add it to state automatically
      }

      setShowCheckInModal(false);
      setSelectedVenue(null);
    } catch (err) {
      console.error('Error checking in:', err);
      alert('Failed to check in. Please try again.');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#c5ccd4]">
      <Header
        onLoginClick={() => setShowAuthModal(true)}
        onProfileClick={() => setShowProfilePage(true)}
      />

      {/* Tab Navigation */}
      <div className="flex border-b-2 border-gray-400 bg-gradient-to-b from-[#6d84a3] to-[#4d6580] shadow-lg">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${
            activeTab === 'map'
              ? 'bg-gradient-to-b from-white to-[#e8eef5] text-gray-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] border-t-2 border-white'
              : 'text-white active:bg-black/20'
          }`}
          style={
            activeTab === 'map'
              ? { textShadow: '0 1px 0 rgba(255,255,255,0.8)' }
              : { textShadow: '0 -1px 0 rgba(0,0,0,0.5)' }
          }
        >
          <MapPin size={18} />
          Nearby
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${
            activeTab === 'feed'
              ? 'bg-gradient-to-b from-white to-[#e8eef5] text-gray-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] border-t-2 border-white'
              : 'text-white active:bg-black/20'
          }`}
          style={
            activeTab === 'feed'
              ? { textShadow: '0 1px 0 rgba(255,255,255,0.8)' }
              : { textShadow: '0 -1px 0 rgba(0,0,0,0.5)' }
          }
        >
          <Activity size={18} />
          Activity
        </button>
      </div>

      {/* Location Prompt */}
      {!location && !locationError && loading && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <p className="text-sm text-blue-800">
            📍 Requesting your location to find nearby venues...
          </p>
        </div>
      )}

      {/* Location Error */}
      {locationError && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <p className="text-sm text-yellow-800">⚠️ {locationError}</p>
          <p className="text-xs text-yellow-700 mt-1">
            Please enable location permissions in your browser to discover real venues nearby.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'map' ? (
          <div className="h-full flex flex-col">
            <div className="flex-1">
              <Map
                center={location ? [location.lng, location.lat] : [-122.4194, 37.7749]}
                venues={venues}
                onVenueClick={handleVenueClick}
                userLocation={location}
              />
            </div>
            <div className="h-64 border-t-2 border-gray-400 bg-[#c5ccd4] overflow-y-auto shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
              <VenueList venues={venues} loading={loading} onVenueClick={handleVenueClick} />
            </div>
          </div>
        ) : (
          <ActivityFeed checkins={checkins} userLocation={location} onReply={handleReply} />
        )}
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && selectedVenue && (
        <CheckInModal
          venue={selectedVenue}
          userLocation={location}
          onClose={() => {
            setShowCheckInModal(false);
            setSelectedVenue(null);
          }}
          onCheckIn={handleCheckIn}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onContinueAnonymous={() => {
            // Just close the modal, they can check in anonymously
          }}
        />
      )}

      {/* Reply Modal */}
      {showReplyModal && replyTo && (
        <ReplyModal
          originalUser={replyTo.username}
          venueName={replyTo.venueName}
          onClose={() => {
            setShowReplyModal(false);
            setReplyTo(null);
          }}
          onSend={handleSendReply}
        />
      )}

      {/* Profile Page */}
      {showProfilePage && <ProfilePage onClose={() => setShowProfilePage(false)} />}
    </div>
  );
}

export default App;
