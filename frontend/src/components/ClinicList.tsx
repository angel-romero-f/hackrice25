'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import ClinicCard from './ClinicCard';
import { Clinic } from '../hooks/useClinics';

interface ClinicListProps {
  clinics: Clinic[];
  loading: boolean;
}

export default function ClinicList({ clinics, loading }: ClinicListProps) {
  if (loading) {
    return (
      <div className="w-full">
        <div className="space-y-4 w-full">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (clinics.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clinics found</h3>
          <p className="text-gray-600">Try adjusting your filters or search area</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-4 w-full">
        {clinics.map((clinic) => (
          <ClinicCard
            key={clinic._id}
            clinic={clinic}
          />
        ))}
      </div>
    </div>
  );
}