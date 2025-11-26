// Simple geohash implementation for grouping nearby locations
// Using precision 6 (~1.2km x 0.6km grid)

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encode(lat: number, lng: number, precision: number = 6): string {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latMin = -90, latMax = 90;
  let lngMin = -180, lngMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      // longitude
      const lngMid = (lngMin + lngMax) / 2;
      if (lng >= lngMid) {
        idx = (idx << 1) + 1;
        lngMin = lngMid;
      } else {
        idx = idx << 1;
        lngMax = lngMid;
      }
    } else {
      // latitude
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        idx = (idx << 1) + 1;
        latMin = latMid;
      } else {
        idx = idx << 1;
        latMax = latMid;
      }
    }
    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

export function decode(geohash: string): { lat: number; lng: number; error: { lat: number; lng: number } } {
  let evenBit = true;
  let latMin = -90, latMax = 90;
  let lngMin = -180, lngMax = 180;

  for (let i = 0; i < geohash.length; i++) {
    const chr = geohash[i];
    const idx = BASE32.indexOf(chr);
    if (idx === -1) throw new Error('Invalid geohash');

    for (let n = 4; n >= 0; n--) {
      const bitN = (idx >> n) & 1;
      if (evenBit) {
        // longitude
        const lngMid = (lngMin + lngMax) / 2;
        if (bitN === 1) {
          lngMin = lngMid;
        } else {
          lngMax = lngMid;
        }
      } else {
        // latitude
        const latMid = (latMin + latMax) / 2;
        if (bitN === 1) {
          latMin = latMid;
        } else {
          latMax = latMid;
        }
      }
      evenBit = !evenBit;
    }
  }

  const lat = (latMin + latMax) / 2;
  const lng = (lngMin + lngMax) / 2;
  const latErr = latMax - lat;
  const lngErr = lngMax - lng;

  return {
    lat,
    lng,
    error: { lat: latErr, lng: lngErr }
  };
}

// Calculate distance between two points using Haversine formula (in meters)
export function distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Check if a point is within radius of another
export function withinRadius(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusMeters: number
): boolean {
  return distance(lat1, lng1, lat2, lng2) <= radiusMeters;
}

