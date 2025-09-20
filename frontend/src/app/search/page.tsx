'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapPin, Filter, Star, Clock, DollarSign, Heart, ArrowLeft, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import GoogleMap from '../../components/GoogleMap';
import ClinicList from '../../components/ClinicList';
import useClinics, { Clinic } from '../../hooks/useClinics';

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
      pricingType: 'all'
    };
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
      performSearch();
    }
  }, [zipCode]); // eslint-disable-line react-hooks/exhaustive-deps

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
        pricing_type: filters.pricingType !== 'all' ? filters.pricingType : undefined,
        min_rating: filters.minRating > 0 ? filters.minRating : undefined,
      });
    } catch (error) {
      console.error('Error searching clinics:', error);
    }
  };

  // Since we're doing server-side filtering, use clinics directly
  const filteredClinics = Array.isArray(clinics) ? clinics : [];


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
                className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <MapPin className="h-4 w-4" />
                <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
              </button>
              <button
                onClick={() => setShowMap(!showMap)}
                className="hidden lg:flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <MapPin className="h-4 w-4" />
                <span>{showMap ? 'Map & List' : 'List Only'}</span>
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
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {healthIssue} in {zipCode}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {loading ? 'Searching...' : `${filteredClinics.length} healthcare providers found`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-200px)]">
        <div className="flex flex-col xl:flex-row gap-6 h-full">
          {/* Filters Sidebar */}
          <div className={`xl:w-80 flex-shrink-0 ${showFilters ? 'block' : 'hidden xl:block'}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => {
                    // Reset to initial health condition if it exists
                    const initialServices = healthIssue ? mapHealthIssueToServices(healthIssue) : [];
                    setFilters({
                      services: initialServices,
                      languages: [],
                      walkInsOnly: false,
                      lgbtqFriendly: false,
                      immigrantSafe: false,
                      maxDistance: 25,
                      minRating: 0,
                      pricingType: 'all'
                    });
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

          {/* Main Content Area */}
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
            {/* Map Section - Show only when toggled */}
            {showMap && (
              <div className="lg:w-1/2 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Clinics Near You
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span className="hidden sm:inline">Your location</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="hidden sm:inline">Walk-ins</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span className="hidden sm:inline">Appointments</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[calc(100%-60px)] w-full">
                    <GoogleMap
                      clinics={filteredClinics}
                      userLocation={userLocation}
                      onMarkerClick={handleMarkerClick}
                      height="100%"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Results List */}
            <div className={`${showMap ? 'lg:w-1/2' : 'lg:w-full'} min-h-0`}>
              <ClinicList
                clinics={filteredClinics}
                loading={loading}
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