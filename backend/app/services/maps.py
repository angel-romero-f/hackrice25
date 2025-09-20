import googlemaps
from typing import List, Dict, Optional
from app.config import GOOGLE_MAPS_API_KEY

gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)

def get_place_details_with_photos(place_id: str) -> Dict:
    """Get place details including photos from Google Places API"""
    try:
        result = gmaps.place(
            place_id=place_id,
            fields=['name', 'formatted_address', 'formatted_phone_number',
                   'website', 'opening_hours', 'photo', 'type', 'geometry']
        )
        return result.get('result', {})
    except Exception as e:
        print(f"Error fetching place details: {e}")
        return {}

def extract_photo_references(place_details: Dict) -> List[str]:
    """Extract photo references from place details"""
    # Handle both 'photos' (old) and 'photo' (new) field names
    photos = place_details.get('photos', place_details.get('photo', []))
    if not isinstance(photos, list):
        photos = [photos] if photos else []
    return [photo.get('photo_reference') for photo in photos if photo.get('photo_reference')]

def search_healthcare_places(query: str, location: str, radius: int = 10000) -> List[Dict]:
    """Search for healthcare places and return basic info with place IDs"""
    try:
        result = gmaps.places_nearby(
            location=location,
            radius=radius,
            keyword=query,
            type='health'
        )
        return result.get('results', [])
    except Exception as e:
        print(f"Error searching places: {e}")
        return []