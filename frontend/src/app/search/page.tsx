'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, Star, Clock, Heart, ArrowLeft, Users, Shield, MapPin, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ClinicList from '../../components/ClinicList';
import GoogleMap from '../../components/GoogleMap';
import useClinics from '../../hooks/useClinics';

interface FilterState {
  services: string[];
  languages: string[];
  walkInsOnly: boolean;
  lgbtqFriendly: boolean;
  immigrantSafe: boolean;
  maxDistance: number;
  minRating: number;
  pricingType: string;
  minPrice: number;
  maxPrice: number;
}

// Health condition mapping from landing page to filter services
const mapHealthIssueToServices = (healthIssue: string): string[] => {
  const mapping: Record<string, string[]> = {
    'General Checkup': ['Primary Care'],
    'Mental Health': ['Mental Health', 'Behavioral Health'],
    'Urgent Care': ['Urgent Care', 'Emergency Care'],
    'Dental Care': ['Dental Care'],
    'Eye Care': ['Vision'],
    'Women\'s Health': ['Women\'s Health', 'Prenatal Care', 'Pregnancy Testing', 'Birth Control'],
    'Pediatric Care': ['Pediatrics'],
    'Chronic Conditions': ['Chronic Disease Management', 'Primary Care'],
    'Preventive Care': ['Primary Care', 'Health Screenings', 'Preventive Care'],
  };

  return mapping[healthIssue] || [];
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const zipCode = searchParams.get('zip') || '';
  const healthIssue = searchParams.get('issue') || '';

  // Use the custom clinic hook
  const { clinics, loading, error, searchClinics } = useClinics();
  const [filters, setFilters] = useState<FilterState>(() => {
    // Initialize with health condition from landing page
    const initialServices = healthIssue ? mapHealthIssueToServices(healthIssue) : [];
    return {
      services: initialServices,
      languages: [],
      walkInsOnly: false,
      lgbtqFriendly: false,
      immigrantSafe: false,
      maxDistance: 25,
      minRating: 0,
      pricingType: 'all',
      minPrice: 0,
      maxPrice: 200
    };
  });
  const [showFilters, setShowFilters] = useState(false);

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


  useEffect(() => {
    if (zipCode) {
      performSearch();
    }
  }, [zipCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-search when filters change
  useEffect(() => {
    if (zipCode) {
      performSearch();
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const performSearch = async () => {
    try {
      await searchClinics({
        location: zipCode,
        radius_miles: filters.maxDistance,
        services: filters.services.length > 0 ? filters.services : undefined,
        walk_in_accepted: filters.walkInsOnly ? true : undefined,
        lgbtq_friendly: filters.lgbtqFriendly ? true : undefined,
        immigrant_safe: filters.immigrantSafe ? true : undefined,
        languages: filters.languages.length > 0 ? filters.languages : undefined,
        min_rating: filters.minRating > 0 ? filters.minRating : undefined,
      });
    } catch (error) {
      console.error('Error searching clinics:', error);
    }
  };

  // Since we're doing server-side filtering, use clinics directly
  const filteredClinics = Array.isArray(clinics) ? clinics : [];


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </Link>
              <div className="border-l border-gray-300 h-6 mx-3"></div>
              <Image
                src="/careCompass.png"
                alt="Care Compass Logo"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <h1 className="text-xl font-bold text-gray-900">Care Compass</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
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
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {healthIssue} in {zipCode}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {loading ? 'Searching...' : `${filteredClinics.length} healthcare providers found`}
          </p>
        </div>
      </div>

      {/* Active Filters */}
      {(filters.services.length > 0 || filters.languages.length > 0 || filters.walkInsOnly || filters.lgbtqFriendly || filters.immigrantSafe || filters.minRating > 0 || filters.maxPrice < 200) && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>

              {/* Service filters */}
              {filters.services.map((service) => (
                <span key={service} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {service}
                  <button
                    onClick={() => setFilters({...filters, services: filters.services.filter(s => s !== service)})}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              {/* Language filters */}
              {filters.languages.map((language) => (
                <span key={language} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                  {language}
                  <button
                    onClick={() => setFilters({...filters, languages: filters.languages.filter(l => l !== language)})}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              {/* Special accommodation filters */}
              {filters.walkInsOnly && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Walk-ins accepted
                  <button
                    onClick={() => setFilters({...filters, walkInsOnly: false})}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {filters.lgbtqFriendly && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 text-sm font-medium rounded-full">
                  LGBTQ+ friendly
                  <button
                    onClick={() => setFilters({...filters, lgbtqFriendly: false})}
                    className="text-pink-600 hover:text-pink-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {filters.immigrantSafe && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Immigrant safe
                  <button
                    onClick={() => setFilters({...filters, immigrantSafe: false})}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}


              {/* Rating filter */}
              {filters.minRating > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                  {filters.minRating}+ stars
                  <button
                    onClick={() => setFilters({...filters, minRating: 0})}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {/* Price range filter */}
              {filters.maxPrice < 200 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full">
                  Up to ${filters.maxPrice}
                  <button
                    onClick={() => setFilters({...filters, maxPrice: 200})}
                    className="text-emerald-600 hover:text-emerald-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {/* Clear all filters button */}
              <button
                onClick={() => {
                  // Clear all filters
                  setFilters({
                    services: [],
                    languages: [],
                    walkInsOnly: false,
                    lgbtqFriendly: false,
                    immigrantSafe: false,
                    maxDistance: 25,
                    minRating: 0,
                    pricingType: 'all',
                    minPrice: 0,
                    maxPrice: 200
                  });
                  // Also clear URL parameters to "forget" landing page selection
                  router.replace(`/search?zip=${zipCode}`);
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 overflow-hidden">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 lg:flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6 h-[calc(100vh-16rem)] overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => {
                    // Clear all filters including initial health condition
                    setFilters({
                      services: [],
                      languages: [],
                      walkInsOnly: false,
                      lgbtqFriendly: false,
                      immigrantSafe: false,
                      maxDistance: 25,
                      minRating: 0,
                      pricingType: 'all',
                      minPrice: 0,
                      maxPrice: 200
                    });
                    // Also clear URL parameters to "forget" landing page selection
                    router.replace(`/search?zip=${zipCode}`);
                  }}
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

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Price Range
                </label>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900 w-8">
                    $0
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-900 w-12">
                    $200
                  </span>
                </div>
                <div className="text-center mt-2">
                  <span className="text-sm text-gray-600">
                    Up to ${filters.maxPrice}
                  </span>
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

              {/* Apply Filters Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={performSearch}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                    loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Searching...' : 'Apply Filters'}
                </button>
                {error && (
                  <div className="mt-2 text-sm text-red-600">
                    Error: {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area - Clinic List and Map */}
          <div className="flex-1 flex flex-col lg:flex-row gap-6">
            {/* Clinic List */}
            <div className="w-full lg:w-2/3">
              <div className="h-[calc(100vh-16rem)] overflow-y-auto bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <ClinicList
                  clinics={filteredClinics}
                  loading={loading}
                />
              </div>
            </div>

            {/* Map */}
            <div className="w-full lg:w-1/3">
              <GoogleMap
                clinics={filteredClinics}
                userLocation={zipCode ? undefined : { lat: 29.7604, lng: -95.3698 }}
                height="calc(100vh - 16rem)"
                className="w-full"
                onMarkerClick={(clinic) => {
                  // Scroll to clinic in list when marker is clicked
                  const clinicElement = document.getElementById(`clinic-${clinic._id}`);
                  if (clinicElement) {
                    clinicElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
              />
            </div>
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