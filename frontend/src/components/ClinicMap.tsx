'use client';

import React, { useState, useMemo } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Phone, Star, DollarSign } from 'lucide-react';

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

interface ClinicMapProps {
  clinics: Clinic[];
  userLocation?: { lat: number; lng: number };
  onMarkerClick?: (clinic: Clinic) => void;
}

const ClinicMap: React.FC<ClinicMapProps> = ({
  clinics,
  userLocation = { lat: 29.7604, lng: -95.3698 }, // Default to Houston
  onMarkerClick
}) => {
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

  const mapCenter = useMemo(() => {
    if (clinics.length === 0) return userLocation;

    // Calculate center based on clinic locations
    const validClinics = clinics.filter(clinic => clinic.location?.coordinates);
    if (validClinics.length === 0) return userLocation;

    const bounds = validClinics.reduce((acc, clinic) => {
      const [lng, lat] = clinic.location!.coordinates;
      return {
        north: Math.max(acc.north, lat),
        south: Math.min(acc.south, lat),
        east: Math.max(acc.east, lng),
        west: Math.min(acc.west, lng),
      };
    }, {
      north: -90,
      south: 90,
      east: -180,
      west: 180,
    });

    return {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2,
    };
  }, [clinics, userLocation]);

  const extractPrice = (pricing_info?: string) => {
    if (!pricing_info) return 'Contact for pricing';

    if (pricing_info.toLowerCase().includes('free')) {
      return 'Free services';
    }

    if (pricing_info.toLowerCase().includes('sliding')) {
      return 'Sliding scale';
    }

    const match = pricing_info.match(/\$(\d+)/);
    if (match) {
      return `From $${match[1]}`;
    }

    return pricing_info.length > 20 ? pricing_info.substring(0, 20) + '...' : pricing_info;
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <Map
        defaultCenter={mapCenter}
        center={mapCenter}
        defaultZoom={11}
        zoom={11}
        gestureHandling="greedy"
        disableDefaultUI={false}
        className="w-full h-full rounded-lg"
        mapId="clinic-map"
      >
        {/* User location marker */}
        <Marker
          position={userLocation}
          title="Your location"
          icon={{
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="6" fill="#3B82F6" stroke="white" stroke-width="2"/>
              </svg>
            `),
            scaledSize: { width: 16, height: 16 } as google.maps.Size,
            anchor: { x: 8, y: 8 } as google.maps.Point,
          }}
        />

        {/* Clinic markers */}
        {clinics
          .filter(clinic => clinic.location?.coordinates)
          .map((clinic) => {
            const [lng, lat] = clinic.location!.coordinates;

            return (
              <Marker
                key={clinic._id}
                position={{ lat, lng }}
                title={clinic.name}
                onClick={() => {
                  setSelectedClinic(clinic);
                  onMarkerClick?.(clinic);
                }}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                            fill="${clinic.walk_in_accepted ? '#10B981' : '#EF4444'}"
                            stroke="white"
                            stroke-width="1"/>
                    </svg>
                  `),
                  scaledSize: { width: 24, height: 24 } as google.maps.Size,
                  anchor: { x: 12, y: 24 } as google.maps.Point,
                }}
              />
            );
          })}

        {/* Info window for selected clinic */}
        {selectedClinic && selectedClinic.location && (
          <InfoWindow
            position={{
              lat: selectedClinic.location.coordinates[1],
              lng: selectedClinic.location.coordinates[0],
            }}
            onCloseClick={() => setSelectedClinic(null)}
            maxWidth={300}
          >
            <div className="p-3">
              <div className="mb-2">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {selectedClinic.name}
                </h3>
                {selectedClinic.rating && (
                  <div className="mb-2">{renderStars(selectedClinic.rating)}</div>
                )}
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-start">
                  <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{selectedClinic.address}</span>
                </div>

                {selectedClinic.phone && (
                  <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span>{selectedClinic.phone}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="font-medium text-green-600">
                    {extractPrice(selectedClinic.pricing_info)}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {selectedClinic.services.slice(0, 2).map((service) => (
                  <span
                    key={service}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                  >
                    {service}
                  </span>
                ))}
                {selectedClinic.services.length > 2 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{selectedClinic.services.length - 2}
                  </span>
                )}
              </div>

              {selectedClinic.walk_in_accepted && (
                <div className="mt-2 text-xs text-green-600 font-medium">
                  Walk-ins accepted
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-gray-200">
                <div className="flex space-x-2">
                  {selectedClinic.phone && (
                    <button
                      onClick={() => window.open(`tel:${selectedClinic.phone}`)}
                      className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700"
                    >
                      Call
                    </button>
                  )}
                  <button
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedClinic.address)}`
                      )
                    }
                    className="flex-1 border border-blue-600 text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-blue-50"
                  >
                    Directions
                  </button>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
};

export default ClinicMap;