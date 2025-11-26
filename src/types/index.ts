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
  timestamp: string;
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
  { id: 'food', name: 'Food & Drink', icon: '🍽️' },
  { id: 'coffee', name: 'Coffee Shop', icon: '☕' },
  { id: 'bar', name: 'Bar & Nightlife', icon: '🍺' },
  { id: 'shop', name: 'Shopping', icon: '🛍️' },
  { id: 'outdoors', name: 'Outdoors', icon: '🌳' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎭' },
  { id: 'fitness', name: 'Fitness', icon: '💪' },
  { id: 'other', name: 'Other', icon: '📍' },
];

