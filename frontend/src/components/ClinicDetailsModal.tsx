'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Star, MapPin, Phone, Globe, Clock, Heart, Shield, Users, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Clinic } from '../hooks/useClinics';

interface ClinicDetailsModalProps {
  clinic: Clinic;
  isOpen: boolean;
  onClose: () => void;
}

interface ClinicReviewAnalysis {
  clinic_name: string;
  analysis: string;
  force_refresh: boolean;
}

export default function ClinicDetailsModal({ clinic, isOpen, onClose }: ClinicDetailsModalProps) {
  const [reviewAnalysis, setReviewAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchReviewAnalysis = useCallback(async () => {
    if (!clinic?.name) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/clinic-analysis/${encodeURIComponent(clinic.name)}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch analysis: ${response.statusText}`);
      }

      const data: ClinicReviewAnalysis = await response.json();
      setReviewAnalysis(data.analysis);
    } catch (err) {
      console.error('Error fetching clinic analysis:', err);
      setError('Unable to load review analysis at this time.');
    } finally {
      setLoading(false);
    }
  }, [clinic?.name, API_BASE_URL]);

  useEffect(() => {
    if (isOpen && clinic) {
      fetchReviewAnalysis();
    }
  }, [isOpen, clinic, fetchReviewAnalysis]);

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

    const priceMatch = pricing_info.match(/\$\d+(?:\.\d{2})?/g);
    if (priceMatch) {
      return `Starting at ${priceMatch[0]}`;
    }

    return pricing_info;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{clinic.name}</h2>
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {clinic.address}
                {clinic.distance_meters && (
                  <span className="ml-2 text-blue-600">
                    • {formatDistance(clinic.distance_meters)}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Rating and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {clinic.rating && (
                <div className="flex items-center mb-2">
                  <Star className="h-5 w-5 text-yellow-500 mr-1" />
                  <span className="font-medium">{clinic.rating.toFixed(1)}</span>
                  {clinic.user_ratings_total && (
                    <span className="text-gray-600 ml-1">({clinic.user_ratings_total} reviews)</span>
                  )}
                </div>
              )}

              {clinic.phone && (
                <div className="flex items-center text-gray-600 mb-2">
                  <Phone className="h-4 w-4 mr-2" />
                  <a href={`tel:${clinic.phone}`} className="hover:text-blue-600">
                    {clinic.phone}
                  </a>
                </div>
              )}

              {clinic.website && (
                <div className="flex items-center text-gray-600 mb-2">
                  <Globe className="h-4 w-4 mr-2" />
                  <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                    Visit Website
                  </a>
                </div>
              )}

              {clinic.hours && (
                <div className="flex items-center text-gray-600 mb-2">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{clinic.hours}</span>
                </div>
              )}
            </div>

            <div>
              {/* Pricing */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <h4 className="font-medium text-green-800 mb-1">Pricing</h4>
                <p className="text-green-700 text-sm">{extractPrice(clinic.pricing_info)}</p>
              </div>

              {/* Special Features */}
              <div className="space-y-2">
                {clinic.walk_in_accepted && (
                  <div className="flex items-center text-sm text-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Walk-ins accepted
                  </div>
                )}
                {clinic.lgbtq_friendly && (
                  <div className="flex items-center text-sm text-pink-700">
                    <Heart className="h-4 w-4 mr-2" />
                    LGBTQ+ friendly
                  </div>
                )}
                {clinic.immigrant_safe && (
                  <div className="flex items-center text-sm text-blue-700">
                    <Shield className="h-4 w-4 mr-2" />
                    Immigrant safe
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Services Offered</h4>
            <div className="flex flex-wrap gap-2">
              {clinic.services.map((service, index) => (
                <span key={`${service}-${index}`} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200">
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Languages */}
          {clinic.languages.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Languages Spoken</h4>
              <div className="flex flex-wrap gap-2">
                {clinic.languages.map((language, index) => (
                  <span key={`${language}-${index}`} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    <Users className="h-3 w-3 inline mr-1" />
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Review Analysis */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Patient Reviews & Experiences</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Analyzing patient reviews...</span>
                </div>
              ) : error ? (
                <div className="flex items-center text-red-600 py-4">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              ) : reviewAnalysis ? (
                <div className="prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown>{reviewAnalysis}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-gray-500 py-4">
                  No review analysis available for this clinic.
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {clinic.notes && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Additional Information</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">{clinic.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            <div className="space-x-3">
              {clinic.phone && (
                <a
                  href={`tel:${clinic.phone}`}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </a>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Missing import for CheckCircle
function CheckCircle({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}