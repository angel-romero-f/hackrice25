from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv
import google.generativeai as genai
import googlemaps
from pymongo import MongoClient
from typing import Optional, List
from pydantic import BaseModel
from fastapi import Query
import uvicorn

# Import chatbot router from organized structure
from app.routes.chatbot import router as chatbot_router

load_dotenv()

app = FastAPI(
    title="Care Compass API",
    description="Healthcare access platform for uninsured individuals",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
try:
    # MongoDB
    mongo_client = MongoClient(os.getenv("MONGODB_URI"))
    db = mongo_client.carecompass
    clinics_collection = db.clinics
    
    # Google Maps
    gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))
    
    # Gemini AI
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-pro')
except Exception as e:
    print(f"Error initializing services: {e}")

# Pydantic models
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

@app.get("/")
async def root():
    return {"message": "Care Compass API - Connecting you to affordable healthcare"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": {
        "mongodb": "connected" if mongo_client else "disconnected",
        "google_maps": "configured" if os.getenv("GOOGLE_MAPS_API_KEY") else "not configured",
        "gemini": "configured" if os.getenv("GEMINI_API_KEY") else "not configured"
    }}

# Include chatbot router
app.include_router(chatbot_router)

@app.get("/clinics")
async def get_all_clinics(limit: Optional[int] = Query(20, description="Maximum number of clinics to return", le=100)):
    """Get all clinics without location filtering"""
    try:
        clinics = list(clinics_collection.find({}, {"_id": 0}).limit(limit))
        return clinics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_with_ai(query: ChatQuery):
    """AI-powered healthcare guidance using Gemini"""
    try:
        prompt = f"""
        You are a helpful healthcare navigator for uninsured individuals. 
        Answer this question with empathy and practical guidance: {query.message}
        
        Focus on:
        - Free and low-cost healthcare options
        - Community health centers
        - Patient rights and protections
        - Clear, simple language
        - No medical diagnosis or specific medical advice
        
        {f"Additional context: {query.context}" if query.context else ""}
        """
        
        response = model.generate_content(prompt)
        
        return {
            "response": response.text,
            "disclaimer": "This is general information only. For medical emergencies, call 911. This is not medical advice."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@app.post("/clinics/search")
async def search_clinics_filtered(search: ClinicSearch):
    """Search for clinics based on location and detailed filters"""
    try:
        # Geocode the location
        geocode_result = gmaps.geocode(search.location)
        if not geocode_result:
            raise HTTPException(status_code=400, detail="Location not found")

        lat = geocode_result[0]['geometry']['location']['lat']
        lng = geocode_result[0]['geometry']['location']['lng']

        # Build MongoDB query with geospatial search
        query = {}

        # Geospatial query using radius in meters
        radius_meters = (search.radius_miles or 10) * 1609.34  # Convert miles to meters
        query["location"] = {
            "$geoWithin": {
                "$centerSphere": [[lng, lat], radius_meters / 6378100]  # Earth radius in meters
            }
        }

        # Add filter conditions
        if search.service_type:
            query["services"] = {"$regex": search.service_type, "$options": "i"}
        if search.languages:
            query["languages"] = {"$in": search.languages}
        if search.walk_in_only:
            query["walk_in_accepted"] = True
        if search.lgbtq_friendly is not None:
            query["lgbtq_friendly"] = search.lgbtq_friendly
        if search.immigrant_safe is not None:
            query["immigrant_safe"] = search.immigrant_safe

        # Apply limit with a maximum cap
        limit = min(search.limit or 20, 100)

        # Execute query and sort by distance
        clinics_cursor = clinics_collection.aggregate([
            {"$geoNear": {
                "near": {"type": "Point", "coordinates": [lng, lat]},
                "distanceField": "distance_meters",
                "maxDistance": radius_meters,
                "query": {k: v for k, v in query.items() if k != "location"},
                "spherical": True
            }},
            {"$limit": limit},
            {"$project": {"_id": 0}}
        ])

        clinics = list(clinics_cursor)

        return {
            "location": {
                "lat": lat,
                "lng": lng,
                "formatted_address": geocode_result[0]['formatted_address']
            },
            "clinics": clinics,
            "total_found": len(clinics),
            "search_radius_miles": search.radius_miles or 10
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clinics")
async def add_clinic(clinic: Clinic):
    """Add a new clinic to the database"""
    try:
        clinic_dict = clinic.dict()
        result = clinics_collection.insert_one(clinic_dict)
        return {"message": "Clinic added successfully", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/clinics/{clinic_id}")
async def get_clinic(clinic_id: str):
    """Get detailed information about a specific clinic"""
    try:
        from bson import ObjectId
        clinic = clinics_collection.find_one({"_id": ObjectId(clinic_id)}, {"_id": 0})
        if not clinic:
            raise HTTPException(status_code=404, detail="Clinic not found")
        return clinic
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)