// Fetch real venues from OpenStreetMap via Overpass API
export interface OverpassVenue {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  address?: string;
  tags: Record<string, string>;
}

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// Map OSM tags to our venue categories
function categorizeVenue(tags: Record<string, string>): string {
  // Food & Drink
  if (tags.amenity === 'cafe') return 'coffee';
  if (tags.amenity === 'restaurant') return 'restaurant';
  if (tags.amenity === 'bar' || tags.amenity === 'pub') return 'bar';
  if (tags.amenity === 'fast_food') return 'restaurant';
  if (tags.amenity === 'ice_cream') return 'restaurant';

  // Shopping
  if (tags.shop) return 'shopping';
  if (tags.amenity === 'marketplace') return 'shopping';

  // Entertainment
  if (tags.amenity === 'cinema' || tags.amenity === 'theatre') return 'entertainment';
  if (tags.leisure === 'park' || tags.leisure === 'garden') return 'outdoors';
  if (tags.leisure === 'sports_centre' || tags.leisure === 'fitness_centre') return 'gym';
  if (tags.leisure === 'playground') return 'outdoors';

  // Services
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'health';
  if (tags.amenity === 'bank') return 'services';
  if (tags.amenity === 'post_office') return 'services';
  if (tags.amenity === 'library') return 'education';
  if (tags.amenity === 'school' || tags.amenity === 'university') return 'education';

  // Transit
  if (tags.railway === 'station' || tags.amenity === 'bus_station') return 'transport';
  if (tags.aeroway === 'aerodrome') return 'transport';

  // Tourism
  if (tags.tourism === 'museum' || tags.tourism === 'gallery') return 'entertainment';
  if (tags.tourism === 'attraction' || tags.tourism === 'viewpoint') return 'outdoors';
  if (tags.historic) return 'entertainment';

  return 'other';
}

function formatAddress(tags: Record<string, string>): string | undefined {
  const parts: string[] = [];

  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:city']) parts.push(tags['addr:city']);

  return parts.length > 0 ? parts.join(' ') : undefined;
}

export async function fetchNearbyVenues(
  lat: number,
  lng: number,
  radiusMeters: number = 1000
): Promise<OverpassVenue[]> {
  console.log(
    `📍 Fetching venues near ${lat.toFixed(4)}, ${lng.toFixed(4)} (${radiusMeters}m radius)`
  );

  // Overpass QL query to find nearby POIs
  const query = `
    [out:json][timeout:25];
    (
      node["name"]["amenity"](around:${radiusMeters},${lat},${lng});
      node["name"]["shop"](around:${radiusMeters},${lat},${lng});
      node["name"]["leisure"](around:${radiusMeters},${lat},${lng});
      node["name"]["tourism"](around:${radiusMeters},${lat},${lng});
      way["name"]["amenity"](around:${radiusMeters},${lat},${lng});
      way["name"]["shop"](around:${radiusMeters},${lat},${lng});
      way["name"]["leisure"](around:${radiusMeters},${lat},${lng});
      way["name"]["tourism"](around:${radiusMeters},${lat},${lng});
    );
    out center;
  `;

  try {
    console.log('🌐 Calling Overpass API...');
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log(`📡 Overpass response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📦 Got ${data.elements?.length || 0} raw elements from Overpass`);

    const venues: OverpassVenue[] = [];

    for (const element of data.elements) {
      if (!element.tags?.name) continue;

      const venueLat = element.lat || element.center?.lat;
      const venueLng = element.lon || element.center?.lon;

      if (!venueLat || !venueLng) continue;

      venues.push({
        id: `osm-${element.type}-${element.id}`,
        name: element.tags.name,
        lat: venueLat,
        lng: venueLng,
        category: categorizeVenue(element.tags),
        address: formatAddress(element.tags),
        tags: element.tags,
      });
    }

    // Sort by distance
    venues.sort((a, b) => {
      const distA = calculateDistance(lat, lng, a.lat, a.lng);
      const distB = calculateDistance(lat, lng, b.lat, b.lng);
      return distA - distB;
    });

    console.log(`✅ Returning ${venues.length} parsed venues`);
    return venues.slice(0, 50); // Limit to 50 venues
  } catch (error) {
    console.error('❌ Error fetching venues from Overpass:', error);
    throw error;
  }
}

// Haversine formula to calculate distance in meters
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
