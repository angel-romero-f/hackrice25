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
import uvicorn

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
    db = mongo_client.care_compass
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

@app.post("/search/clinics")
async def search_clinics(search: ClinicSearch):
    """Search for clinics based on location and filters"""
    try:
        # Geocode the location
        geocode_result = gmaps.geocode(search.location)
        if not geocode_result:
            raise HTTPException(status_code=400, detail="Location not found")
        
        lat = geocode_result[0]['geometry']['location']['lat']
        lng = geocode_result[0]['geometry']['location']['lng']
        
        # Build MongoDB query
        query = {}
        if search.service_type:
            query["services"] = {"$regex": search.service_type, "$options": "i"}
        if search.languages:
            query["languages"] = {"$in": search.languages}
        if search.walk_in_only:
            query["walk_in_accepted"] = True
        
        # For now, return all matching clinics (in production, add geospatial queries)
        clinics = list(clinics_collection.find(query, {"_id": 0}))
        
        return {
            "location": {
                "lat": lat,
                "lng": lng,
                "formatted_address": geocode_result[0]['formatted_address']
            },
            "clinics": clinics[:20]  # Limit to 20 results
        }
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