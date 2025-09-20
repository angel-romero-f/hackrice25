'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapPin, Filter, Star, Clock, DollarSign, Heart, ArrowLeft, Phone, Globe, Users, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import ClinicMap from '../../components/ClinicMap';

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

interface FilterState {
  services: string[];
  languages: string[];
  walkInsOnly: boolean;
  lgbtqFriendly: boolean;
  immigrantSafe: boolean;
  maxDistance: number;
  minRating: number;
  pricingType: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const zipCode = searchParams.get('zip') || '';
  const healthIssue = searchParams.get('issue') || '';

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    services: [],
    languages: [],
    walkInsOnly: false,
    lgbtqFriendly: false,
    immigrantSafe: false,
    maxDistance: 25,
    minRating: 0,
    pricingType: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [userLocation] = useState<{ lat: number; lng: number }>({
    lat: 29.7604,
    lng: -95.3698
  });

  // Available options based on seed data
  const availableServices = [
    'Primary Care', 'Urgent Care', 'Emergency Care', 'Dental Care', 'Mental Health',
    'Women\'s Health', 'Pediatrics', 'Vision', 'Pharmacy', 'Chronic Disease Management',
    'Prenatal Care', 'Behavioral Health', 'Physical Therapy', 'Health Screenings',
    'Pregnancy Testing', 'STD Testing', 'Birth Control', 'Case Management', 'Health Education'
  ];

  const availableLanguages = [
    'English', 'Spanish', 'Vietnamese', 'Arabic', 'Multiple languages with interpreters'
  ];

  const pricingOptions = [
    { value: 'all', label: 'All pricing options' },
    { value: 'free', label: 'Free services' },
    { value: 'sliding_scale', label: 'Sliding scale/income-based' },
    { value: 'fixed_price', label: 'Fixed self-pay pricing' }
  ];

  useEffect(() => {
    if (zipCode) {
      searchClinics();
    }
  }, [zipCode, healthIssue]); // eslint-disable-line react-hooks/exhaustive-deps

  const searchClinics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/clinics/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: zipCode,
          radius_miles: filters.maxDistance,
          services: healthIssue ? [healthIssue] : undefined
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setClinics(data);
      } else {
        console.error('Failed to fetch clinics');
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClinics = clinics.filter(clinic => {
    // Walk-ins filter
    if (filters.walkInsOnly && !clinic.walk_in_accepted) return false;

    // Distance filter
    if (clinic.distance_meters && clinic.distance_meters > filters.maxDistance * 1609.34) return false;

    // LGBTQ+ friendly filter
    if (filters.lgbtqFriendly && !clinic.lgbtq_friendly) return false;

    // Immigrant safe filter
    if (filters.immigrantSafe && !clinic.immigrant_safe) return false;

    // Services filter
    if (filters.services.length > 0) {
      const hasMatchingService = filters.services.some(service =>
        clinic.services.some(clinicService =>
          clinicService.toLowerCase().includes(service.toLowerCase()) ||
          service.toLowerCase().includes(clinicService.toLowerCase())
        )
      );
      if (!hasMatchingService) return false;
    }

    // Languages filter
    if (filters.languages.length > 0) {
      const hasMatchingLanguage = filters.languages.some(language =>
        clinic.languages.some(clinicLang =>
          clinicLang.toLowerCase().includes(language.toLowerCase())
        )
      );
      if (!hasMatchingLanguage) return false;
    }

    // Rating filter
    if (clinic.rating && clinic.rating < filters.minRating) return false;

    // Pricing type filter
    if (filters.pricingType !== 'all' && clinic.pricing_info) {
      const pricingLower = clinic.pricing_info.toLowerCase();
      if (filters.pricingType === 'free' && !pricingLower.includes('free')) return false;
      if (filters.pricingType === 'sliding_scale' && !pricingLower.includes('sliding')) return false;
      if (filters.pricingType === 'fixed_price' && (pricingLower.includes('sliding') || pricingLower.includes('free'))) return false;
    }

    return true;
  });

  const formatDistance = (meters?: number) => {
    if (!meters) return '';
    const miles = meters * 0.000621371;
    return `${miles.toFixed(1)} mi`;
  };

  const extractPrice = (pricing_info?: string) => {
    if (!pricing_info) return 'Contact for pricing';

    // Check for free services
    if (pricing_info.toLowerCase().includes('free')) {
      return 'Free services available';
    }

    // Check for sliding scale
    if (pricing_info.toLowerCase().includes('sliding')) {
      return 'Sliding scale pricing';
    }

    // Extract specific price
    const match = pricing_info.match(/\$(\d+)/);
    if (match) {
      return `From $${match[1]}`;
    }

    // Truncate long pricing info
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

  const handleMarkerClick = (clinic: Clinic) => {
    // Scroll to clinic in results list
    const element = document.getElementById(`clinic-${clinic._id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </Link>
              <div className="border-l border-gray-300 h-6 mx-3"></div>
              <Heart className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Care Compass</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowMap(!showMap)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <MapPin className="h-4 w-4" />
                <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Summary */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {healthIssue} in {zipCode}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {loading ? 'Searching...' : `${filteredClinics.length} healthcare providers found`}
              </p>
            </div>
            <div className="mt-3 md:mt-0">
              <span className="text-sm text-gray-500">Sort by: </span>
              <select className="text-sm border-gray-300 rounded-md">
                <option>Distance</option>
                <option>Rating</option>
                <option>Price</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Map Section */}
        {showMap && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Clinics Near You
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span>Your location</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Walk-ins accepted</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span>Appointment needed</span>
                  </div>
                </div>
              </div>
              <div className="h-96 w-full">
                <ClinicMap
                  clinics={filteredClinics}
                  userLocation={userLocation}
                  onMarkerClick={handleMarkerClick}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setFilters({
                    services: [],
                    languages: [],
                    walkInsOnly: false,
                    lgbtqFriendly: false,
                    immigrantSafe: false,
                    maxDistance: 25,
                    minRating: 0,
                    pricingType: 'all'
                  })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              </div>

              {/* Services */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Services Needed
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableServices.map((service) => (
                    <label key={service} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.services.includes(service)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, services: [...filters.services, service]});
                          } else {
                            setFilters({...filters, services: filters.services.filter(s => s !== service)});
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Distance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Distance from you
                </label>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={filters.maxDistance}
                    onChange={(e) => setFilters({...filters, maxDistance: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-900 w-16">
                    {filters.maxDistance} mi
                  </span>
                </div>
              </div>

              {/* Pricing Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Pricing Options
                </label>
                <div className="space-y-2">
                  {pricingOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="pricing"
                        value={option.value}
                        checked={filters.pricingType === option.value}
                        onChange={(e) => setFilters({...filters, pricingType: e.target.value})}
                        className="border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Users className="h-4 w-4 inline mr-1" />
                  Languages Spoken
                </label>
                <div className="space-y-2">
                  {availableLanguages.map((language) => (
                    <label key={language} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.languages.includes(language)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, languages: [...filters.languages, language]});
                          } else {
                            setFilters({...filters, languages: filters.languages.filter(l => l !== language)});
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">{language}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Minimum Rating
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3, 4].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilters({...filters, minRating: rating})}
                      className={`flex items-center justify-center space-x-1 px-2 py-2 rounded-md text-sm font-medium ${
                        filters.minRating === rating
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      <Star className="h-3 w-3" />
                      <span className="text-xs">{rating === 0 ? 'Any' : `${rating}+`}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Accommodations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Special Accommodations
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.walkInsOnly}
                      onChange={(e) => setFilters({...filters, walkInsOnly: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <Clock className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-sm text-gray-700">Walk-ins accepted</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.lgbtqFriendly}
                      onChange={(e) => setFilters({...filters, lgbtqFriendly: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <Heart className="h-4 w-4 mr-1 text-pink-500" />
                    <span className="text-sm text-gray-700">LGBTQ+ friendly</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.immigrantSafe}
                      onChange={(e) => setFilters({...filters, immigrantSafe: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <Shield className="h-4 w-4 mr-1 text-green-500" />
                    <span className="text-sm text-gray-700">Immigrant safe</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredClinics.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No clinics found</h3>
                <p className="text-gray-600">Try adjusting your filters or search area</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClinics.map((clinic) => (
                  <div
                    key={clinic._id}
                    id={`clinic-${clinic._id}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 mr-4">
                              {clinic.name}
                            </h3>
                            {clinic.rating && renderStars(clinic.rating)}
                          </div>

                          <div className="flex items-center text-gray-600 text-sm mb-3">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="mr-4">{clinic.address}</span>
                            {clinic.distance_meters && (
                              <span className="text-gray-500">
                                {formatDistance(clinic.distance_meters)} away
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                            {clinic.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-1 text-gray-400" />
                                <span>{clinic.phone}</span>
                              </div>
                            )}
                            {clinic.website && (
                              <div className="flex items-center">
                                <Globe className="h-4 w-4 mr-1 text-gray-400" />
                                <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  Visit website
                                </a>
                              </div>
                            )}
                            {clinic.walk_in_accepted && (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span>Walk-ins accepted</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right ml-6">
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

                      {/* Services */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {clinic.services.slice(0, 4).map((service) => (
                            <span key={service} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200">
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
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div className="flex space-x-3">
                          <button className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            Call Now
                          </button>
                          <button className="border border-blue-600 text-blue-600 px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            Directions
                          </button>
                        </div>
                        <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center">
                          View Details
                          <span className="ml-1">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search results...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}