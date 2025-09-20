import os
import requests
from typing import List, Optional
from google.cloud import storage
from app.config import GOOGLE_MAPS_API_KEY
import hashlib
import io

class PhotoService:
    def __init__(self, bucket_name: str = "care-compass-photos"):
        self.bucket_name = bucket_name
        self.storage_client = storage.Client()

    def _get_bucket(self):
        try:
            return self.storage_client.bucket(self.bucket_name)
        except Exception as e:
            print(f"Error accessing bucket {self.bucket_name}: {e}")
            return None

    def download_place_photo(self, photo_reference: str, max_width: int = 400) -> Optional[bytes]:
        """Download photo from Google Places API using photo reference"""
        url = f"https://maps.googleapis.com/maps/api/place/photo"
        params = {
            'photoreference': photo_reference,
            'maxwidth': max_width,
            'key': GOOGLE_MAPS_API_KEY
        }

        try:
            response = requests.get(url, params=params, timeout=30)
            if response.status_code == 200:
                return response.content
            else:
                print(f"Failed to download photo: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error downloading photo: {e}")
            return None

    def upload_photo_to_gcs(self, photo_data: bytes, filename: str) -> Optional[str]:
        """Upload photo to Google Cloud Storage and return public URL"""
        bucket = self._get_bucket()
        if not bucket:
            return None

        try:
            blob = bucket.blob(f"clinic-photos/{filename}")
            blob.upload_from_string(
                photo_data,
                content_type='image/jpeg'
            )

            blob.make_public()
            return blob.public_url
        except Exception as e:
            print(f"Error uploading photo to GCS: {e}")
            return None

    def generate_filename(self, place_id: str, photo_reference: str) -> str:
        """Generate unique filename for photo"""
        hash_input = f"{place_id}_{photo_reference}"
        filename_hash = hashlib.md5(hash_input.encode()).hexdigest()
        return f"{place_id}_{filename_hash}.jpg"

    def process_place_photos(self, place_id: str, photo_references: List[str]) -> List[str]:
        """Process multiple photos for a place and return GCS URLs"""
        photo_urls = []

        for photo_ref in photo_references[:3]:  # Limit to 3 photos to manage costs
            filename = self.generate_filename(place_id, photo_ref)

            # Check if photo already exists in GCS
            bucket = self._get_bucket()
            if bucket:
                blob = bucket.blob(f"clinic-photos/{filename}")
                if blob.exists():
                    blob.make_public()
                    photo_urls.append(blob.public_url)
                    continue

            # Download and upload new photo
            photo_data = self.download_place_photo(photo_ref)
            if photo_data:
                photo_url = self.upload_photo_to_gcs(photo_data, filename)
                if photo_url:
                    photo_urls.append(photo_url)

        return photo_urls

    def delete_photo(self, filename: str) -> bool:
        """Delete photo from GCS"""
        bucket = self._get_bucket()
        if not bucket:
            return False

        try:
            blob = bucket.blob(f"clinic-photos/{filename}")
            blob.delete()
            return True
        except Exception as e:
            print(f"Error deleting photo: {e}")
            return False

photo_service = PhotoService()