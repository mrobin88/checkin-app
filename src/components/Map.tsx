import { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Venue, Location } from '../types';
import { VENUE_CATEGORIES } from '../types';

interface MapProps {
  center: [number, number];
  venues: Venue[];
  onVenueClick: (venue: Venue) => void;
  userLocation: Location | null;
}

export default function Map({ center, venues, onVenueClick, userLocation }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Using OpenStreetMap tiles with street names
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: center,
      zoom: 16,
      attributionControl: false,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update center when location changes
  useEffect(() => {
    if (map.current && userLocation) {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 17,
        duration: 1000,
      });
    }
  }, [userLocation]);

  // Update venue markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add user location marker
    if (userLocation) {
      const userMarker = document.createElement('div');
      userMarker.className = 'user-location-marker';
      userMarker.style.cssText = `
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;

      const marker = new maplibregl.Marker({ element: userMarker })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);

      markers.current.push(marker);
    }

    // Add venue markers
    venues.forEach((venue) => {
      const category = VENUE_CATEGORIES.find((c) => c.id === venue.category);
      const emoji = category?.icon || '📍';

      const el = document.createElement('div');
      el.className = 'venue-marker';
      el.innerHTML = `
        <div style="
          background: white;
          border: 2px solid ${venue.verified ? '#3b82f6' : '#9ca3af'};
          border-radius: 12px;
          padding: 4px 8px;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: transform 0.2s;
        " class="venue-marker-inner">
          ${emoji}
        </div>
      `;

      el.addEventListener('click', () => onVenueClick(venue));
      el.addEventListener('mouseenter', () => {
        const inner = el.querySelector('.venue-marker-inner') as HTMLElement;
        if (inner) inner.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        const inner = el.querySelector('.venue-marker-inner') as HTMLElement;
        if (inner) inner.style.transform = 'scale(1)';
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([venue.lng, venue.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px;">
                <div style="font-weight: 600; margin-bottom: 4px;">${venue.name}</div>
                <div style="font-size: 12px; color: #666;">
                  ${venue.checkin_count || 0} check-ins
                </div>
              </div>
            `)
        )
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [venues, userLocation, onVenueClick]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
