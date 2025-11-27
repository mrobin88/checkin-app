import { useState, useEffect } from 'react';
import Map from './components/Map';
import Header from './components/Header';
import CheckInModal from './components/CheckInModal';
import ActivityFeed from './components/ActivityFeed';
import VenueList from './components/VenueList';
import AuthModal from './components/AuthModal';
import { useGeolocation } from './hooks/useGeolocation';
import { useAuth } from './hooks/useAuth';
import { Venue, CheckIn } from './types';
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
  const [activeTab, setActiveTab] = useState<'map' | 'feed'>('map');
  const [loading, setLoading] = useState(true);

  // Fetch nearby venues
  useEffect(() => {
    if (location) {
      fetchNearbyVenues(location.lat, location.lng);
    }
  }, [location]);

  // Load check-ins from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('checkins');
    if (stored) {
      try {
        const localCheckins = JSON.parse(stored);
        setCheckins(localCheckins);
      } catch (err) {
        console.error('Error loading check-ins:', err);
      }
    }
    
    // Also try to fetch from Supabase
    fetchRecentCheckins();
    
    // Subscribe to new check-ins
    const subscription = supabase
      .channel('checkins_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'checkins' },
        () => {
          fetchRecentCheckins();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchNearbyVenues = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      
      // Try fetching from OpenStreetMap first (real data!)
      const overpassVenues = await fetchOverpassVenues(lat, lng, 100);
      
      // Convert to our Venue format
      const venues: Venue[] = overpassVenues.map(v => ({
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

  const fetchRecentCheckins = async () => {
    try {
      const { data, error } = await supabase
        .rpc('recent_checkins', { limit_count: 50 });

      if (error) throw error;
      
      // Transform the data to match CheckIn type
      const formattedCheckins: CheckIn[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        venue_id: item.venue_id,
        comment: item.comment,
        checked_in_at: item.checked_in_at,
        geohash: '',
        user: {
          id: item.user_id,
          username: item.username,
          avatar_url: item.avatar_url,
          created_at: ''
        },
        venue: {
          id: item.venue_id,
          name: item.venue_name,
          category: item.venue_category,
          lat: 0,
          lng: 0,
          address: '',
          created_by: '',
          verified: false,
          geohash: '',
          created_at: ''
        }
      }));

      setCheckins(formattedCheckins);
    } catch (err) {
      console.error('Error fetching check-ins:', err);
      setCheckins([]);
    }
  };

  const handleVenueClick = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowCheckInModal(true);
  };

  const handleCheckIn = async (venueId: string, comment?: string) => {
    if (!location || !selectedVenue) return;

    try {
      const username = user?.user_metadata?.full_name || 
                      user?.email?.split('@')[0] || 
                      'Anonymous';
      const avatarUrl = user?.user_metadata?.avatar_url || 
                       `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

      // Create check-in object
      const checkIn: CheckIn = {
        id: crypto.randomUUID(),
        user_id: user?.id || 'anonymous',
        venue_id: venueId,
        comment: comment || '',
        checked_in_at: new Date().toISOString(),
        geohash: encodeGeohash(location.lat, location.lng, 6),
        user: {
          id: user?.id || 'anonymous',
          username: username,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString(),
        },
        venue: selectedVenue,
      };

      // Store in localStorage
      const stored = localStorage.getItem('checkins');
      const existingCheckins = stored ? JSON.parse(stored) : [];
      existingCheckins.unshift(checkIn);
      localStorage.setItem('checkins', JSON.stringify(existingCheckins.slice(0, 100)));

      // Update state to show immediately
      setCheckins([checkIn, ...checkins]);

      console.log('✅ Checked in to:', selectedVenue.name);
      
      setShowCheckInModal(false);
      setSelectedVenue(null);
    } catch (err) {
      console.error('Error checking in:', err);
      alert('Failed to check in. Please try again.');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#c5ccd4]">
      <Header onLoginClick={() => setShowAuthModal(true)} />
      
      {/* Tab Navigation */}
      <div className="flex border-b-2 border-gray-400 bg-gradient-to-b from-[#6d84a3] to-[#4d6580] shadow-lg">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${
            activeTab === 'map'
              ? 'bg-gradient-to-b from-white to-[#e8eef5] text-gray-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] border-t-2 border-white'
              : 'text-white active:bg-black/20'
          }`}
          style={activeTab === 'map' ? { textShadow: '0 1px 0 rgba(255,255,255,0.8)' } : { textShadow: '0 -1px 0 rgba(0,0,0,0.5)' }}
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
          style={activeTab === 'feed' ? { textShadow: '0 1px 0 rgba(255,255,255,0.8)' } : { textShadow: '0 -1px 0 rgba(0,0,0,0.5)' }}
        >
          <Activity size={18} />
          Activity
        </button>
      </div>

      {/* Location Prompt */}
      {!location && !locationError && loading && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <p className="text-sm text-blue-800">📍 Requesting your location to find nearby venues...</p>
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
              <VenueList
                venues={venues}
                loading={loading}
                onVenueClick={handleVenueClick}
              />
            </div>
          </div>
        ) : (
          <ActivityFeed checkins={checkins} />
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
    </div>
  );
}

export default App;

