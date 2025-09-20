#!/usr/bin/env python3
"""
Care Compass Data Seeder
Populates MongoDB with Houston healthcare facilities from Google Places API
"""

import os
import logging
import requests
from typing import List, Dict, Optional
from datetime import datetime, timezone

import googlemaps
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.local.env')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HealthcareSeeder:
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_MAPS_API_KEY')
        self.gmaps = googlemaps.Client(key=self.api_key)
        self.mongo_client = MongoClient(os.getenv('MONGODB_URI'))
        self.db = self.mongo_client.carecompass
        self.clinics_collection = self.db.clinics

        # Houston coordinates for search center
        self.houston_coords = {'lat': 29.7604, 'lng': -95.3698}
        self.search_radius = 50000  # 50km radius around Houston

        # Search terms prioritizing free/low-cost healthcare
        self.search_terms = [
            "free clinic Houston",
            "community health center Houston",
            "federally qualified health center Houston",
            "urgent care Houston self pay",
            "sliding scale healthcare Houston"
        ]

        # Known Houston clinics with pricing (prioritize these)
        self.priority_clinics = [
            "NeuMed Modern Urgent Care",
            "Texas MedClinic",
            "AFC West University Urgent Care",
            "Insight Urgent Care",
            "FastMed Urgent Care",
            "Texas Health Breeze Urgent Care",
            "Houston Health Department",
            "Harris County Public Health",
            "Legacy Community Health",
            "Lone Star Family Health Center"
        ]

    def search_healthcare_facilities(self) -> List[Dict]:
        """Search for healthcare facilities using new Google Places API"""
        all_places = []
        seen_place_ids = set()

        logger.info(f"Starting search for healthcare facilities in Houston...")

        for search_term in self.search_terms:
            logger.info(f"Searching for: {search_term}")

            try:
                # Use the new Places API via direct HTTP request
                url = "https://places.googleapis.com/v1/places:searchText"

                headers = {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': self.api_key,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.nationalPhoneNumber,places.websiteUri,places.regularOpeningHours'
                }

                data = {
                    'textQuery': search_term,
                    'locationBias': {
                        'circle': {
                            'center': {
                                'latitude': self.houston_coords['lat'],
                                'longitude': self.houston_coords['lng']
                            },
                            'radius': self.search_radius
                        }
                    },
                    'maxResultCount': 20
                }

                response = requests.post(url, json=data, headers=headers)

                if response.status_code == 200:
                    result = response.json()
                    places = result.get('places', [])

                    for place in places:
                        place_id = place.get('id')
                        if place_id and place_id not in seen_place_ids:
                            seen_place_ids.add(place_id)
                            # Convert new API format to our expected format
                            formatted_place = self.convert_new_api_format(place)
                            all_places.append(formatted_place)

                            # Stop if we hit our limit
                            if len(all_places) >= 30:
                                break

                    if len(all_places) >= 30:
                        break
                else:
                    logger.error(f"API request failed for {search_term}: {response.status_code} - {response.text}")

            except Exception as e:
                logger.error(f"Error searching for {search_term}: {e}")
                continue

        logger.info(f"Found {len(all_places)} unique healthcare facilities")
        return all_places[:30]  # Limit to 30

    def convert_new_api_format(self, place: Dict) -> Dict:
        """Convert new Places API format to legacy format for compatibility"""
        return {
            'place_id': place.get('id'),
            'name': place.get('displayName', {}).get('text', 'Unknown Clinic'),
            'vicinity': place.get('formattedAddress', ''),
            'geometry': {
                'location': {
                    'lat': place.get('location', {}).get('latitude', 0),
                    'lng': place.get('location', {}).get('longitude', 0)
                }
            },
            'rating': place.get('rating'),
            'user_ratings_total': place.get('userRatingCount'),
            'types': place.get('types', []),
            'formatted_phone_number': place.get('nationalPhoneNumber'),
            'website': place.get('websiteUri'),
            'opening_hours': place.get('regularOpeningHours')
        }

    def get_place_details(self, place_id: str) -> Optional[Dict]:
        """Get detailed information for a specific place"""
        try:
            details = self.gmaps.place(
                place_id=place_id,
                fields=[
                    'name', 'formatted_address', 'formatted_phone_number',
                    'website', 'opening_hours', 'rating', 'user_ratings_total',
                    'types', 'geometry', 'reviews'
                ]
            )
            return details.get('result')
        except Exception as e:
            logger.error(f"Error getting details for place {place_id}: {e}")
            return None

    def extract_services_from_types(self, types: List[str]) -> List[str]:
        """Extract likely services from Google Places types"""
        services = []

        type_mapping = {
            'hospital': 'Emergency Care',
            'doctor': 'Primary Care',
            'dentist': 'Dental Care',
            'pharmacy': 'Pharmacy',
            'physiotherapist': 'Physical Therapy',
            'health': 'General Healthcare'
        }

        for place_type in types:
            if place_type in type_mapping:
                services.append(type_mapping[place_type])

        # Default services for healthcare facilities
        if not services:
            services = ['Primary Care', 'General Healthcare']

        return list(set(services))  # Remove duplicates

    def determine_pricing_info(self, name: str) -> str:
        """Determine pricing info based on clinic name and known data"""
        name_lower = name.lower()

        # Known pricing from research
        pricing_data = {
            'neumed': 'Urgent Care Visit: $139, In-House Testing: $49, X-Ray: $139',
            'texas medClinic': 'Base self-pay: $225 plus additional services',
            'afc': 'Level 1 Clinical Visit with Lab: $169',
            'insight urgent care': 'Basic urgent care exam: $150+',
            'fastmed': 'Self-pay pricing available - contact for details',
            'breeze urgent care': 'Flat rate $205 covers most services',
            'houston health department': 'Sliding fee scale based on income',
            'harris county public health': 'Sliding fee scale - co-pays based on household size & income',
            'legacy community health': 'Sliding fee scale available',
            'lone star family health': 'Sliding Fee Discount Program based on Federal Poverty Guidelines'
        }

        for clinic_key, pricing in pricing_data.items():
            if clinic_key in name_lower:
                return pricing

        # Check for common indicators of free/sliding scale
        free_indicators = ['free clinic', 'community health', 'federally qualified', 'fqhc']
        for indicator in free_indicators:
            if indicator in name_lower:
                return 'Sliding fee scale likely available - contact for details'

        return 'Contact clinic for pricing information'

    def is_likely_safe_space(self, name: str, types: List[str]) -> Dict[str, bool]:
        """Determine if clinic is likely LGBTQ+ friendly and immigrant safe"""
        name_lower = name.lower()

        # Community health centers and FQHCs are typically more inclusive
        inclusive_indicators = [
            'community health', 'federally qualified', 'fqhc', 'public health',
            'harris county', 'houston health department', 'legacy community'
        ]

        is_community_clinic = any(indicator in name_lower for indicator in inclusive_indicators)

        return {
            'lgbtq_friendly': is_community_clinic,
            'immigrant_safe': is_community_clinic
        }

    def format_clinic_data(self, place: Dict, details: Dict = None) -> Dict:
        """Format place data into our clinic schema"""
        if details is None:
            details = place  # For new API, we already have most details

        name = place.get('name', 'Unknown Clinic')
        address = place.get('vicinity', '') or details.get('formatted_address', '')
        types = place.get('types', [])

        # Determine safety indicators
        safety_info = self.is_likely_safe_space(name, types)

        clinic_data = {
            'name': name,
            'address': address,
            'phone': place.get('formatted_phone_number') or details.get('formatted_phone_number'),
            'website': place.get('website') or details.get('website'),
            'services': self.extract_services_from_types(types),
            'pricing_info': self.determine_pricing_info(name),
            'languages': ['English'],  # Default, could be enhanced
            'hours': self.format_hours(place.get('opening_hours') or details.get('opening_hours')),
            'walk_in_accepted': True,  # Assume true for urgent care/clinics
            'lgbtq_friendly': safety_info['lgbtq_friendly'],
            'immigrant_safe': safety_info['immigrant_safe'],
            'rating': place.get('rating'),
            'user_ratings_total': place.get('user_ratings_total'),
            'google_place_id': place.get('place_id'),
            'location': {
                'type': 'Point',
                'coordinates': [
                    place['geometry']['location']['lng'],
                    place['geometry']['location']['lat']
                ]
            },
            'notes': self.generate_notes(name, types),
            'last_updated': datetime.now(timezone.utc)
        }

        return clinic_data

    def format_hours(self, opening_hours: Dict = None) -> Optional[str]:
        """Format opening hours into readable string"""
        if not opening_hours or 'weekday_text' not in opening_hours:
            return None

        return '; '.join(opening_hours['weekday_text'])

    def generate_notes(self, name: str, types: List[str]) -> str:
        """Generate helpful notes about the clinic"""
        notes = []

        name_lower = name.lower()

        if 'urgent care' in name_lower:
            notes.append('Walk-ins welcome for urgent medical needs')

        if any(t in types for t in ['hospital', 'emergency']):
            notes.append('Emergency services available')

        if 'community' in name_lower or 'public health' in name_lower:
            notes.append('Community-focused healthcare, typically offers sliding scale fees')

        if 'federally qualified' in name_lower or 'fqhc' in name_lower:
            notes.append('Federally Qualified Health Center - required to serve all patients regardless of ability to pay')

        return '; '.join(notes) if notes else None

    def seed_database(self):
        """Main seeding function"""
        logger.info("Starting healthcare facility seeding process...")

        # Clear existing data
        logger.info("Clearing existing clinic data...")
        self.clinics_collection.delete_many({})

        # Search for facilities
        places = self.search_healthcare_facilities()

        if not places:
            logger.warning("No healthcare facilities found!")
            return

        # Process each place
        seeded_count = 0
        for i, place in enumerate(places, 1):
            logger.info(f"Processing {i}/{len(places)}: {place.get('name', 'Unknown')}")

            try:
                # Get detailed information
                place_id = place.get('place_id')
                details = self.get_place_details(place_id) if place_id else {}

                # Format for our database
                clinic_data = self.format_clinic_data(place, details)

                # Insert into database
                self.clinics_collection.insert_one(clinic_data)
                seeded_count += 1

                logger.info(f"✅ Added: {clinic_data['name']}")

            except Exception as e:
                logger.error(f"❌ Failed to process {place.get('name', 'Unknown')}: {e}")
                continue

        logger.info(f"🎉 Seeding complete! Added {seeded_count} healthcare facilities")

        # Create indexes for better query performance
        self.create_indexes()

    def create_indexes(self):
        """Create database indexes for better performance"""
        logger.info("Creating database indexes...")

        # Geospatial index for location-based queries
        self.clinics_collection.create_index([("location", "2dsphere")])

        # Text index for name and service searches
        self.clinics_collection.create_index([
            ("name", "text"),
            ("services", "text"),
            ("notes", "text")
        ])

        # Other useful indexes
        self.clinics_collection.create_index("google_place_id")
        self.clinics_collection.create_index("walk_in_accepted")
        self.clinics_collection.create_index("lgbtq_friendly")
        self.clinics_collection.create_index("immigrant_safe")

        logger.info("✅ Database indexes created")

def main():
    """Run the seeder"""
    seeder = HealthcareSeeder()
    seeder.seed_database()

if __name__ == "__main__":
    main()