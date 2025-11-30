export interface Venue {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  category: string;
  created_by: string;
  verified: boolean;
  geohash: string;
  created_at: string;
  checkin_count?: number;
}

export interface CheckIn {
  id: string;
  user_id: string;
  venue_id: string;
  comment?: string;
  checked_in_at: string;
  geohash: string;
  user?: User;
  venue?: Venue;
}

export interface Message {
  id: string;
  venue_id: string;
  venue_name: string;
  venue_category?: string;
  venue_lat?: number;
  venue_lng?: number;
  venue_address?: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  geohash: string;
  created_at: string;
  is_deleted?: boolean;
  parent_message_id?: string;
  reply_count?: number;
}

export interface Notification {
  id: string;
  user_id: string;
  from_user_id: string;
  from_username: string;
  from_avatar_url?: string;
  message_id: string;
  parent_message_id?: string;
  notification_type: 'reply' | 'mention';
  content: string;
  venue_name?: string;
  is_read: boolean;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  email?: string;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  friend?: User;
  created_at: string;
}

export interface UserProfile extends User {
  bio?: string;
  checkin_count?: number;
  friend_count?: number;
  places_count?: number;
  streak?: number;
  points?: number;
}

// The "Tom from MySpace" - everyone follows this user by default
export const DEFAULT_FRIEND: User = {
  id: 'tom-checkin-official',
  username: 'Matthew Robin',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MatthewRobin&backgroundColor=b6e3f4',
  email: 'ratthewrobin@gmail.com',
  created_at: '2024-01-01T00:00:00Z',
};

export interface Reply {
  id: string;
  parent_id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface VenueCategory {
  id: string;
  name: string;
  icon: string;
}

export const VENUE_CATEGORIES: VenueCategory[] = [
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'coffee', name: 'Coffee Shop', icon: '☕' },
  { id: 'bar', name: 'Bar & Nightlife', icon: '🍺' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
  { id: 'outdoors', name: 'Outdoors & Parks', icon: '🌳' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎭' },
  { id: 'gym', name: 'Fitness & Gym', icon: '💪' },
  { id: 'health', name: 'Health & Medical', icon: '🏥' },
  { id: 'services', name: 'Services', icon: '🏢' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'transport', name: 'Transport', icon: '🚇' },
  { id: 'other', name: 'Other', icon: '📍' },
];

