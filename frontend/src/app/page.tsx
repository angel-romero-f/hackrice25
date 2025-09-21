'use client';

import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HomePage() {
  const [zipCode, setZipCode] = useState('');
  const [healthIssue, setHealthIssue] = useState('');
  const router = useRouter();

  const availableServices = [
    'Primary Care', 'Urgent Care', 'Emergency Care', 'Dental Care', 'Mental Health',
    'Women\'s Health', 'Pediatrics', 'Vision', 'Pharmacy', 'Chronic Disease Management',
    'Prenatal Care', 'Behavioral Health', 'Physical Therapy', 'Health Screenings',
    'Pregnancy Testing', 'STD Testing', 'Birth Control', 'Case Management', 'Health Education'
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

  const scrollToAbout = () => {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };



  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/careCompass.png"
                alt="Care Compass Logo"
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <h1 className="text-2xl font-bold text-gray-900">Care Compass</h1>
            </div>
            <nav className="hidden md:flex space-x-10">
              <a href="#chat" className="text-gray-600 hover:text-gray-900 font-normal text-base transition-colors">Get Help</a>
              <button onClick={scrollToAbout} className="text-gray-600 hover:text-gray-900 font-normal text-base transition-colors">About Us</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 px-4">
        <div className="max-w-full mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              Find affordable healthcare near you
            </h2>
            <p className="text-xl text-gray-600 font-medium">
              Connect with free and low-cost clinics in your area. No insurance required.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white rounded-xl border border-gray-200 shadow-xl p-2 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-2 items-end">
              {/* Health Issue Dropdown */}
              <div className="flex-1 md:flex-[2]">
                <div className="relative">
                  <select
                    id="issue"
                    value={healthIssue}
                    onChange={(e) => setHealthIssue(e.target.value)}
                    className="w-full px-4 py-4 border-0 rounded-lg text-gray-900 focus:ring-0 focus:border-0 appearance-none bg-white text-base placeholder-gray-500"
                  >
                    <option value="">Services Needed</option>
                    {availableServices.map((service) => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Zip Code Input */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    id="zipcode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Houston, TX"
                    className="w-full px-4 py-4 border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-0 focus:border-0 text-base"
                  />
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


      {/* About Care Compass - Combined Section */}
      <section id="about" className="py-16 bg-gray-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">About Care Compass</h3>
            <p className="text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto mb-8">
              Our mission is to connect uninsured individuals to affordable healthcare by providing access to
              free and sliding-scale clinics, transparent pricing, and AI-powered guidance in plain language.
            </p>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Healthcare is a human right. We&rsquo;re here to help you access it, regardless of your insurance status.
            </p>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-3">28M+</div>
              <div className="text-sm text-gray-600 font-medium mb-2">Uninsured Americans</div>
              <div className="text-xs text-gray-500">need affordable care</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-3">Free</div>
              <div className="text-sm text-gray-600 font-medium mb-2">No Cost to Search</div>
              <div className="text-xs text-gray-500">Compare options freely</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-3">Private</div>
              <div className="text-sm text-gray-600 font-medium mb-2">Anonymous Browsing</div>
              <div className="text-xs text-gray-500">Your privacy protected</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-3">24/7</div>
              <div className="text-sm text-gray-600 font-medium mb-2">AI Assistant</div>
              <div className="text-xs text-gray-500">Healthcare guidance</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
