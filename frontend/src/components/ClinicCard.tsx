'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Phone, Globe, Users, Shield, CheckCircle, Star, Clock, Heart } from 'lucide-react';
import { Clinic } from '../hooks/useClinics';

interface ClinicCardProps {
  clinic: Clinic;
}

export default function ClinicCard({ clinic }: ClinicCardProps) {
  const formatDistance = (meters?: number) => {
    if (!meters) return '';
    const miles = meters * 0.000621371;
    return `${miles.toFixed(1)} mi`;
  };

  const extractPrice = (pricing_info?: string) => {
    if (!pricing_info) return 'Contact for pricing';

    if (pricing_info.toLowerCase().includes('free')) {
      return 'Free services available';
    }

    if (pricing_info.toLowerCase().includes('sliding')) {
      return 'Sliding scale pricing';
    }

    const match = pricing_info.match(/\$(\d+)/);
    if (match) {
      return `From $${match[1]}`;
    }

    return pricing_info.length > 30 ? pricing_info.substring(0, 30) + '...' : pricing_info;
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div
      id={`clinic-${clinic._id}`}
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300 w-full max-w-full overflow-hidden min-w-0"
    >
      <div className="p-6">
        {/* Header with image */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Clinic Image */}
          <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg overflow-hidden relative">
            {clinic.image_urls && clinic.image_urls.length > 0 ? (
              <Image
                src={clinic.image_urls[0]}
                alt={`${clinic.name} exterior`}
                fill
                className="object-cover"
                sizes="96px"
                onError={() => {
                  // Handle error by showing fallback
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">
                <MapPin className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* Clinic Info and Pricing Container */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-4">
            {/* Clinic Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                <h3 className="text-xl font-semibold text-gray-900 break-words">
                  {clinic.name}
                </h3>
                {clinic.rating && renderStars(clinic.rating)}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center text-gray-600 text-sm mb-3 gap-2">
                <div className="flex items-start min-w-0">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="break-words">{clinic.address}</span>
                </div>
                {clinic.distance_meters && (
                  <span className="text-gray-500 flex-shrink-0 sm:ml-4">
                    {formatDistance(clinic.distance_meters)} away
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
                {clinic.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                    <span>{clinic.phone}</span>
                  </div>
                )}
                {clinic.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                    <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Visit website
                    </a>
                  </div>
                )}
                {clinic.walk_in_accepted && (
                  <div className="flex items-center text-green-600 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>Walk-ins accepted</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="text-left sm:text-right flex-shrink-0">
              <div className="text-lg font-semibold text-green-600 mb-1">
                {extractPrice(clinic.pricing_info)}
              </div>
              {clinic.user_ratings_total && (
                <div className="text-sm text-gray-500">
                  {clinic.user_ratings_total} reviews
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {clinic.services.slice(0, 4).map((service, index) => (
              <span key={`${service}-${index}`} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200">
                {service}
              </span>
            ))}
            {clinic.services.length > 4 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                +{clinic.services.length - 4} more services
              </span>
            )}
          </div>
        </div>

        {/* Special Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {clinic.lgbtq_friendly && (
            <span className="px-3 py-1 bg-pink-50 text-pink-700 text-sm font-medium rounded-full border border-pink-200 flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              LGBTQ+ friendly
            </span>
          )}
          {clinic.immigrant_safe && (
            <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200 flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              Immigrant safe
            </span>
          )}
          {clinic.languages.length > 1 && (
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full border border-purple-200 flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {clinic.languages.length} languages
            </span>
          )}
        </div>

        {/* Hours */}
        {clinic.hours && (
          <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-md">
            <Clock className="h-4 w-4 inline mr-2 text-gray-400" />
            <span className="font-medium">Hours:</span> {clinic.hours.length > 100 ? clinic.hours.substring(0, 100) + '...' : clinic.hours}
          </div>
        )}

        {/* Notes */}
        {clinic.notes && (
          <div className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <span className="font-medium text-blue-800">Note:</span> <span className="text-blue-700">{clinic.notes}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              Call Now
            </button>
            <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Directions
            </button>
          </div>
          <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center self-start sm:self-auto">
            View Details
            <span className="ml-1">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}