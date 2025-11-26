import { CheckIn } from '../types';
import { distance } from './geohash';

// Anti-spoofing constants
const MAX_CHECKINS_PER_HOUR = 5;
const MAX_VELOCITY_MPS = 150; // ~540 km/h (faster than most cars, slower than planes)
const LOCATION_VERIFICATION_RADIUS = 100; // meters

export interface VelocityCheckResult {
  allowed: boolean;
  reason?: string;
  velocity?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  count?: number;
}

// Check if user is checking in too frequently
export function checkRateLimit(recentCheckins: CheckIn[]): RateLimitResult {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const checkinsInLastHour = recentCheckins.filter(
    c => new Date(c.checked_in_at) > oneHourAgo
  );

  if (checkinsInLastHour.length >= MAX_CHECKINS_PER_HOUR) {
    return {
      allowed: false,
      reason: `Maximum ${MAX_CHECKINS_PER_HOUR} check-ins per hour exceeded`,
      count: checkinsInLastHour.length
    };
  }

  return { allowed: true };
}

// Check if user is moving too fast (velocity check)
export function checkVelocity(
  lastCheckin: CheckIn | null,
  currentLat: number,
  currentLng: number,
  venue: { lat: number; lng: number }
): VelocityCheckResult {
  if (!lastCheckin || !lastCheckin.venue) {
    return { allowed: true };
  }

  const lastVenue = lastCheckin.venue;
  const timeDiffMs = Date.now() - new Date(lastCheckin.checked_in_at).getTime();
  const timeDiffSeconds = timeDiffMs / 1000;

  // If more than 1 hour, allow (user could have taken any transport)
  if (timeDiffSeconds > 3600) {
    return { allowed: true };
  }

  const dist = distance(lastVenue.lat, lastVenue.lng, venue.lat, venue.lng);
  const velocity = dist / timeDiffSeconds; // meters per second

  if (velocity > MAX_VELOCITY_MPS) {
    return {
      allowed: false,
      reason: `Impossible travel speed detected (${Math.round(velocity * 3.6)} km/h)`,
      velocity
    };
  }

  return { allowed: true, velocity };
}

// Verify user's claimed location matches venue location
export function verifyLocation(
  userLat: number,
  userLng: number,
  venueLat: number,
  venueLng: number
): boolean {
  const dist = distance(userLat, userLng, venueLat, venueLng);
  return dist <= LOCATION_VERIFICATION_RADIUS;
}

// Combined anti-spoofing check
export interface AntiSpoofResult {
  allowed: boolean;
  reasons: string[];
}

export function performAntiSpoofChecks(
  userLat: number,
  userLng: number,
  venue: { lat: number; lng: number },
  recentCheckins: CheckIn[],
  lastCheckin: CheckIn | null
): AntiSpoofResult {
  const reasons: string[] = [];

  // Rate limit check
  const rateLimitResult = checkRateLimit(recentCheckins);
  if (!rateLimitResult.allowed) {
    reasons.push(rateLimitResult.reason!);
  }

  // Velocity check
  const velocityResult = checkVelocity(lastCheckin, userLat, userLng, venue);
  if (!velocityResult.allowed) {
    reasons.push(velocityResult.reason!);
  }

  // Location verification
  if (!verifyLocation(userLat, userLng, venue.lat, venue.lng)) {
    reasons.push(`You must be within ${LOCATION_VERIFICATION_RADIUS}m of the venue to check in`);
  }

  return {
    allowed: reasons.length === 0,
    reasons
  };
}

