import { useState, useEffect } from 'react';
import Map from './components/Map';
import Header from './components/Header';
import CheckInModal from './components/CheckInModal';
import ActivityFeed from './components/ActivityFeed';
import VenueList from './components/VenueList';
import { useGeolocation } from './hooks/useGeolocation';
import { Venue, CheckIn } from './types';
import { supabase } from './lib/supabase';
import { MapPin, Activity } from 'lucide-react';

function App() {
  const { location, error: locationError } = useGeolocation();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'feed'>('map');
  const [loading, setLoading] = useState(true);

  // Fetch nearby venues
  useEffect(() => {
    if (location) {
      fetchNearbyVenues(location.lat, location.lng);
    }
  }, [location]);

  // Fetch recent check-ins
  useEffect(() => {
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
      const { data, error } = await supabase
        .rpc('nearby_venues', {
          user_lat: lat,
          user_lng: lng,
          radius_meters: 5000
        });

      if (error) throw error;
      setVenues(data || []);
    } catch (err) {
      console.error('Error fetching venues:', err);
      // For demo purposes, use mock data if Supabase not configured
      setVenues(getMockVenues(lat, lng));
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
        timestamp: item.timestamp,
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
      // Use mock data for demo
      setCheckins(getMockCheckins());
    }
  };

  const handleVenueClick = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowCheckInModal(true);
  };

  const handleCheckIn = async (venueId: string, comment?: string) => {
    if (!location) return;

    try {
      // This would call the actual Supabase function
      // For now, just refresh the check-ins
      await fetchRecentCheckins();
      setShowCheckInModal(false);
      setSelectedVenue(null);
    } catch (err) {
      console.error('Error checking in:', err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${
            activeTab === 'map'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500'
          }`}
        >
          <MapPin size={18} />
          Nearby
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${
            activeTab === 'feed'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500'
          }`}
        >
          <Activity size={18} />
          Activity
        </button>
      </div>

      {/* Location Error */}
      {locationError && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <p className="text-sm text-yellow-800">{locationError}</p>
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
            <div className="h-64 border-t border-gray-200 bg-white overflow-y-auto">
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
    </div>
  );
}

// Mock data for demo purposes
function getMockVenues(lat: number, lng: number): Venue[] {
  return [
    {
      id: '1',
      name: 'Blue Bottle Coffee',
      lat: lat + 0.001,
      lng: lng + 0.001,
      address: '123 Main St',
      category: 'coffee',
      created_by: 'demo',
      verified: true,
      geohash: 'abc123',
      created_at: new Date().toISOString(),
      checkin_count: 42
    },
    {
      id: '2',
      name: 'The Mission',
      lat: lat - 0.002,
      lng: lng + 0.002,
      address: '456 Valencia St',
      category: 'bar',
      created_by: 'demo',
      verified: true,
      geohash: 'def456',
      created_at: new Date().toISOString(),
      checkin_count: 28
    },
    {
      id: '3',
      name: 'Golden Gate Park',
      lat: lat + 0.003,
      lng: lng - 0.001,
      address: 'Golden Gate Park',
      category: 'outdoors',
      created_by: 'demo',
      verified: false,
      geohash: 'ghi789',
      created_at: new Date().toISOString(),
      checkin_count: 156
    }
  ];
}

function getMockCheckins(): CheckIn[] {
  return [
    {
      id: '1',
      user_id: 'user1',
      venue_id: 'venue1',
      comment: 'Best coffee in town! ☕',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      geohash: 'abc',
      user: {
        id: 'user1',
        username: 'sarah_chen',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        created_at: ''
      },
      venue: {
        id: 'venue1',
        name: 'Blue Bottle Coffee',
        category: 'coffee',
        lat: 0,
        lng: 0,
        address: '',
        created_by: '',
        verified: true,
        geohash: '',
        created_at: ''
      }
    },
    {
      id: '2',
      user_id: 'user2',
      venue_id: 'venue2',
      comment: 'Happy hour vibes 🍺',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      geohash: 'def',
      user: {
        id: 'user2',
        username: 'mike_jones',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
        created_at: ''
      },
      venue: {
        id: 'venue2',
        name: 'The Mission',
        category: 'bar',
        lat: 0,
        lng: 0,
        address: '',
        created_by: '',
        verified: true,
        geohash: '',
        created_at: ''
      }
    }
  ];
}

export default App;

