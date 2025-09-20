'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';

interface Clinic {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  services: string[];
  pricing_info?: string;
  languages: string[];
  hours?: string;
  walk_in_accepted: boolean;
  lgbtq_friendly: boolean;
  immigrant_safe: boolean;
  website?: string;
  notes?: string;
  distance_meters?: number;
  rating?: number;
  user_ratings_total?: number;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

interface GoogleMapProps {
  clinics: Clinic[];
  userLocation?: { lat: number; lng: number };
  onMarkerClick?: (clinic: Clinic) => void;
  height?: string;
  className?: string;
}

// Simple Google Maps API loader
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      resolve();
      return;
    }

    // Check if already loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for existing script to load
      const checkLoaded = () => {
        if (window.google && window.google.maps) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));

    document.head.appendChild(script);
  });
};

const GoogleMap: React.FC<GoogleMapProps> = ({
  clinics,
  userLocation = { lat: 29.7604, lng: -95.3698 },
  onMarkerClick,
  height = '400px',
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize the map
  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      await loadGoogleMapsScript();

      const map = new google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 11,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi.medical',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Create info window
      infoWindowRef.current = new google.maps.InfoWindow();

      // Add user location marker
      new google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        zIndex: 1000
      });

      setIsMapLoaded(true);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
    }
  }, [userLocation]);

  // Update clinic markers
  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers for clinics
    clinics
      .filter(clinic => clinic.location?.coordinates)
      .forEach(clinic => {
        const [lng, lat] = clinic.location!.coordinates;
        const position = { lat, lng };

        const marker = new google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: clinic.name,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: clinic.walk_in_accepted ? '#10B981' : '#EF4444',
            fillOpacity: 0.9,
            strokeColor: '#FFFFFF',
            strokeWeight: 1,
            rotation: 180,
          },
          zIndex: 100
        });

        // Create info window content
        const createInfoWindowContent = (clinic: Clinic): string => {
          const extractPrice = (pricing_info?: string) => {
            if (!pricing_info) return 'Contact for pricing';
            if (pricing_info.toLowerCase().includes('free')) return 'Free services';
            if (pricing_info.toLowerCase().includes('sliding')) return 'Sliding scale';
            const match = pricing_info.match(/\$(\d+)/);
            if (match) return `From $${match[1]}`;
            return pricing_info.length > 20 ? pricing_info.substring(0, 20) + '...' : pricing_info;
          };

          const renderStars = (rating?: number) => {
            if (!rating) return '';
            const stars = Array.from({ length: 5 }, (_, i) =>
              i < rating ? '★' : '☆'
            ).join('');
            return `<div style="color: #FCD34D; margin: 4px 0;">${stars} (${rating.toFixed(1)})</div>`;
          };

          return `
            <div style="max-width: 300px; padding: 12px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="margin-bottom: 8px;">
                <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">
                  ${clinic.name}
                </h3>
                ${renderStars(clinic.rating)}
              </div>

              <div style="margin-bottom: 12px; font-size: 12px; color: #6B7280; line-height: 1.4;">
                <div style="display: flex; align-items: flex-start; margin-bottom: 4px;">
                  <span style="margin-right: 4px;">📍</span>
                  <span>${clinic.address}</span>
                </div>

                ${clinic.phone ? `
                  <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <span style="margin-right: 4px;">📞</span>
                    <span>${clinic.phone}</span>
                  </div>
                ` : ''}

                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="margin-right: 4px;">💰</span>
                  <span style="font-weight: 600; color: #059669;">
                    ${extractPrice(clinic.pricing_info)}
                  </span>
                </div>
              </div>

              <div style="margin-bottom: 12px;">
                ${clinic.services.slice(0, 2).map(service =>
                  `<span style="display: inline-block; padding: 2px 8px; background-color: #EFF6FF; color: #2563EB; font-size: 11px; border-radius: 12px; margin-right: 4px; margin-bottom: 4px;">${service}</span>`
                ).join('')}
                ${clinic.services.length > 2 ?
                  `<span style="display: inline-block; padding: 2px 8px; background-color: #F3F4F6; color: #6B7280; font-size: 11px; border-radius: 12px;">+${clinic.services.length - 2}</span>`
                  : ''
                }
              </div>

              ${clinic.walk_in_accepted ? `
                <div style="font-size: 12px; color: #059669; font-weight: 500; margin-bottom: 8px;">
                  ✅ Walk-ins accepted
                </div>
              ` : ''}

              <div style="display: flex; gap: 8px; margin-top: 12px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
                ${clinic.phone ? `
                  <a href="tel:${clinic.phone}"
                     style="flex: 1; background-color: #2563EB; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 500; text-align: center;">
                    Call
                  </a>
                ` : ''}
                <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.address)}"
                   target="_blank"
                   style="flex: 1; border: 1px solid #2563EB; color: #2563EB; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 500; text-align: center;">
                  Directions
                </a>
              </div>
            </div>
          `;
        };

        // Add click listener
        marker.addListener('click', () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(createInfoWindowContent(clinic));
            infoWindowRef.current.open(mapInstanceRef.current, marker);
          }

          // Call the callback if provided
          onMarkerClick?.(clinic);
        });

        markersRef.current.push(marker);
      });

    // Adjust map bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();

      // Add user location to bounds
      bounds.extend(userLocation);

      // Add all clinic markers to bounds
      markersRef.current.forEach(marker => {
        const position = marker.getPosition();
        if (position) {
          bounds.extend(position);
        }
      });

      mapInstanceRef.current.fitBounds(bounds);

      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(mapInstanceRef.current, 'bounds_changed', () => {
        const zoom = mapInstanceRef.current?.getZoom();
        if (zoom && zoom > 15) {
          mapInstanceRef.current?.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [clinics, isMapLoaded, onMarkerClick, userLocation]);

  // Initialize map on mount
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Update markers when clinics change
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%' }}
      className={`rounded-lg border border-gray-200 ${className}`}
    />
  );
};

export default GoogleMap;
'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';

interface Clinic {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  services: string[];
  pricing_info?: string;
  languages: string[];
  hours?: string;
  walk_in_accepted: boolean;
  lgbtq_friendly: boolean;
  immigrant_safe: boolean;
  website?: string;
  notes?: string;
  distance_meters?: number;
  rating?: number;
  user_ratings_total?: number;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

interface GoogleMapProps {
  clinics: Clinic[];
  userLocation?: { lat: number; lng: number };
  onMarkerClick?: (clinic: Clinic) => void;
  height?: string;
  className?: string;
}

// Load Google Maps API script
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));

    document.head.appendChild(script);
  });
};

const GoogleMap: React.FC<GoogleMapProps> = ({
  clinics,
  userLocation = { lat: 29.7604, lng: -95.3698 },
  onMarkerClick,
  height = '400px',
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize the map
  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      await loadGoogleMapsScript();

      const map = new google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 11,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi.medical',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Create info window
      infoWindowRef.current = new google.maps.InfoWindow();

      // Add user location marker
      new google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        zIndex: 1000
      });

      setIsMapLoaded(true);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
    }
  }, [userLocation]);

  // Update clinic markers
  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers for clinics
    clinics
      .filter(clinic => clinic.location?.coordinates)
      .forEach(clinic => {
        const [lng, lat] = clinic.location!.coordinates;
        const position = { lat, lng };

        const marker = new google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: clinic.name,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: clinic.walk_in_accepted ? '#10B981' : '#EF4444',
            fillOpacity: 0.9,
            strokeColor: '#FFFFFF',
            strokeWeight: 1,
            rotation: 180,
          },
          zIndex: 100
        });

        // Create info window content
        const createInfoWindowContent = (clinic: Clinic): string => {
          const extractPrice = (pricing_info?: string) => {
            if (!pricing_info) return 'Contact for pricing';
            if (pricing_info.toLowerCase().includes('free')) return 'Free services';
            if (pricing_info.toLowerCase().includes('sliding')) return 'Sliding scale';
            const match = pricing_info.match(/\$(\d+)/);
            if (match) return `From $${match[1]}`;
            return pricing_info.length > 20 ? pricing_info.substring(0, 20) + '...' : pricing_info;
          };

          const renderStars = (rating?: number) => {
            if (!rating) return '';
            const stars = Array.from({ length: 5 }, (_, i) =>
              i < rating ? '★' : '☆'
            ).join('');
            return `<div style="color: #FCD34D; margin: 4px 0;">${stars} (${rating.toFixed(1)})</div>`;
          };

          return `
            <div style="max-width: 300px; padding: 12px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="margin-bottom: 8px;">
                <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">
                  ${clinic.name}
                </h3>
                ${renderStars(clinic.rating)}
              </div>

              <div style="margin-bottom: 12px; font-size: 12px; color: #6B7280; line-height: 1.4;">
                <div style="display: flex; align-items: flex-start; margin-bottom: 4px;">
                  <span style="margin-right: 4px;">📍</span>
                  <span>${clinic.address}</span>
                </div>

                ${clinic.phone ? `
                  <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <span style="margin-right: 4px;">📞</span>
                    <span>${clinic.phone}</span>
                  </div>
                ` : ''}

                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="margin-right: 4px;">💰</span>
                  <span style="font-weight: 600; color: #059669;">
                    ${extractPrice(clinic.pricing_info)}
                  </span>
                </div>
              </div>

              <div style="margin-bottom: 12px;">
                ${clinic.services.slice(0, 2).map(service =>
                  `<span style="display: inline-block; padding: 2px 8px; background-color: #EFF6FF; color: #2563EB; font-size: 11px; border-radius: 12px; margin-right: 4px; margin-bottom: 4px;">${service}</span>`
                ).join('')}
                ${clinic.services.length > 2 ?
                  `<span style="display: inline-block; padding: 2px 8px; background-color: #F3F4F6; color: #6B7280; font-size: 11px; border-radius: 12px;">+${clinic.services.length - 2}</span>`
                  : ''
                }
              </div>

              ${clinic.walk_in_accepted ? `
                <div style="font-size: 12px; color: #059669; font-weight: 500; margin-bottom: 8px;">
                  ✅ Walk-ins accepted
                </div>
              ` : ''}

              <div style="display: flex; gap: 8px; margin-top: 12px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
                ${clinic.phone ? `
                  <a href="tel:${clinic.phone}"
                     style="flex: 1; background-color: #2563EB; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 500; text-align: center;">
                    Call
                  </a>
                ` : ''}
                <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.address)}"
                   target="_blank"
                   style="flex: 1; border: 1px solid #2563EB; color: #2563EB; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 500; text-align: center;">
                  Directions
                </a>
              </div>
            </div>
          `;
        };

        // Add click listener
        marker.addListener('click', () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(createInfoWindowContent(clinic));
            infoWindowRef.current.open(mapInstanceRef.current, marker);
          }

          // Call the callback if provided
          onMarkerClick?.(clinic);
        });

        markersRef.current.push(marker);
      });

    // Adjust map bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();

      // Add user location to bounds
      bounds.extend(userLocation);

      // Add all clinic markers to bounds
      markersRef.current.forEach(marker => {
        const position = marker.getPosition();
        if (position) {
          bounds.extend(position);
        }
      });

      mapInstanceRef.current.fitBounds(bounds);

      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(mapInstanceRef.current, 'bounds_changed', () => {
        const zoom = mapInstanceRef.current?.getZoom();
        if (zoom && zoom > 15) {
          mapInstanceRef.current?.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [clinics, isMapLoaded, onMarkerClick, userLocation]);

  // Initialize map on mount
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Update markers when clinics change
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%' }}
      className={`rounded-lg border border-gray-200 ${className}`}
    />
  );
};

export default GoogleMap;