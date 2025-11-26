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

export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  email?: string;
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

