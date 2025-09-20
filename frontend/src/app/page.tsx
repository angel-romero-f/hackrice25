'use client';

import React, { useState } from 'react';
import { MapPin, Heart, Search, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [zipCode, setZipCode] = useState('');
  const [healthIssue, setHealthIssue] = useState('');
  const router = useRouter();

  const commonIssues = [
    'General Checkup',
    'Mental Health',
    'Urgent Care',
    'Dental Care',
    'Eye Care',
    'Women\'s Health',
    'Pediatric Care',
    'Chronic Conditions',
    'Preventive Care'
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipCode.trim()) {
      alert('Please enter a ZIP code or location');
      return;
    }
    if (!healthIssue) {
      alert('Please select a health concern');
      return;
    }

    const searchParams = new URLSearchParams({
      zip: zipCode,
      issue: healthIssue
    });
    router.push(`/search?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-4">
            <div className="flex items-center space-x-3">
              <Heart className="h-7 w-7 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Care Compass</h1>
            </div>
            <nav className="hidden md:flex space-x-10">
              <a href="#search" className="text-gray-600 hover:text-gray-900 font-normal text-base transition-colors">Find Care</a>
              <a href="#chat" className="text-gray-600 hover:text-gray-900 font-normal text-base transition-colors">Get Help</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 font-normal text-base transition-colors">About Us</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="bg-white py-12 px-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Find affordable healthcare near you
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with free and low-cost clinics in your area. No insurance required.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              {/* Zip Code Input */}
              <div className="flex-1">
                <label htmlFor="zipcode" className="block text-sm font-semibold text-gray-700 mb-3 text-left">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="zipcode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="ZIP code, city, or address"
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                </div>
              </div>

              {/* Health Issue Dropdown */}
              <div className="flex-1">
                <label htmlFor="issue" className="block text-sm font-semibold text-gray-700 mb-3 text-left">
                  Health concern or service
                </label>
                <div className="relative">
                  <select
                    id="issue"
                    value={healthIssue}
                    onChange={(e) => setHealthIssue(e.target.value)}
                    className="w-full px-4 py-4 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-base"
                  >
                    <option value="">Select a service</option>
                    {commonIssues.map((issue) => (
                      <option key={issue} value={issue}>{issue}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Search Button */}
              <div className="md:w-auto w-full">
                <button
                  type="submit"
                  className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Search className="h-5 w-5" />
                  Find care
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            Healthcare that&rsquo;s accessible to everyone
          </h3>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-4xl mx-auto">
            Care Compass connects uninsured individuals to affordable healthcare by providing access to
            free and sliding-scale clinics, transparent pricing, and AI-powered guidance in plain language.
          </p>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-gray-900 mb-3">28M+</div>
              <div className="text-sm text-gray-600 font-medium">Uninsured Americans need affordable care</div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-gray-900 mb-3">Free</div>
              <div className="text-sm text-gray-600 font-medium">No cost to search and compare options</div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-gray-900 mb-3">Private</div>
              <div className="text-sm text-gray-600 font-medium">Anonymous browsing and searching</div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-gray-900 mb-3">24/7</div>
              <div className="text-sm text-gray-600 font-medium">AI assistant for healthcare guidance</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
