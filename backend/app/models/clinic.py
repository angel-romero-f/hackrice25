from typing import Optional, List
from pydantic import BaseModel

class ClinicSearch(BaseModel):
    location: str
    service_type: Optional[str] = None
    radius_miles: Optional[int] = 10
    languages: Optional[List[str]] = None
    walk_in_only: Optional[bool] = False
    lgbtq_friendly: Optional[bool] = None
    immigrant_safe: Optional[bool] = None
    limit: Optional[int] = 20

class ChatQuery(BaseModel):
    message: str
    context: Optional[str] = None

class ReviewAnalysisData(BaseModel):
    review_summary: Optional[str] = None
    google_rating: Optional[float] = None
    total_reviews: Optional[int] = None
    last_analyzed: Optional[str] = None  # ISO datetime string
    analysis_confidence: Optional[str] = None  # 'high', 'medium', 'low'
    cache_expires_at: Optional[str] = None  # ISO datetime string

class Clinic(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None
    services: List[str]
    pricing_info: Optional[str] = None
    languages: List[str] = ["English"]
    hours: Optional[str] = None
    walk_in_accepted: bool = False
    lgbtq_friendly: bool = False
    immigrant_safe: bool = False
    website: Optional[str] = None
    notes: Optional[str] = None
    image_urls: Optional[List[str]] = None
    review_analysis: Optional[ReviewAnalysisData] = None