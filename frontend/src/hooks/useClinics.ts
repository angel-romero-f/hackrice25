import { useCallback } from 'react';
import useApi, { PostRequestBody, GetRequestParams } from './useApi';

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

interface SearchClinicsParams {
  location: string;
  radius_miles?: number;
  services?: string[];
  walk_in_accepted?: boolean;
  lgbtq_friendly?: boolean;
  immigrant_safe?: boolean;
  languages?: string[];
  pricing_type?: string;
  min_rating?: number;
}

interface GetClinicsParams extends GetRequestParams {
  walk_in_accepted?: boolean;
  lgbtq_friendly?: boolean;
  immigrant_safe?: boolean;
  services?: string[];
  languages?: string[];
}

const useClinics = () => {
  const api = useApi<Clinic[]>();

  // Search clinics with location and filters (POST /clinics/search)
  const searchClinics = useCallback(async (params: SearchClinicsParams) => {
    const body: PostRequestBody = {
      location: params.location,
      radius_miles: params.radius_miles || 25,
    };

    // Add optional filters
    if (params.services && params.services.length > 0) {
      body.services = params.services;
    }

    if (params.walk_in_accepted !== undefined) {
      body.walk_in_accepted = params.walk_in_accepted;
    }

    if (params.lgbtq_friendly !== undefined) {
      body.lgbtq_friendly = params.lgbtq_friendly;
    }

    if (params.immigrant_safe !== undefined) {
      body.immigrant_safe = params.immigrant_safe;
    }

    if (params.languages && params.languages.length > 0) {
      body.languages = params.languages;
    }

    if (params.pricing_type) {
      body.pricing_type = params.pricing_type;
    }

    if (params.min_rating !== undefined && params.min_rating > 0) {
      body.min_rating = params.min_rating;
    }

    return api.post('/clinics/search', body);
  }, [api]);

  // Get all clinics with optional filters (GET /clinics)
  const getClinics = useCallback(async (params?: GetClinicsParams) => {
    return api.get('/clinics', params);
  }, [api]);

  // Get specific clinic by ID (GET /clinics/:id)
  const getClinicById = useCallback(async (clinicId: string) => {
    // Create a new API instance for single clinic fetching
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/clinics/${clinicId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch clinic: ${response.statusText}`);
    }
    return response.json();
  }, []);

  return {
    // State
    clinics: api.data,
    loading: api.loading,
    error: api.error,

    // Methods
    searchClinics,
    getClinics,
    getClinicById,
    reset: api.reset,
  };
};

export default useClinics;
export type { Clinic, SearchClinicsParams, GetClinicsParams };