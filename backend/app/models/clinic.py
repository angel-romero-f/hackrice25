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