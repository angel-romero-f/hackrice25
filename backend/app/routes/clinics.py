from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.models.clinic import ClinicSearch, Clinic
from app.services.database import clinics_collection
from app.services.maps import gmaps

router = APIRouter()

@router.get("/clinics")
async def get_all_clinics(limit: Optional[int] = Query(20, description="Maximum number of clinics to return", le=100)):
    """Get all clinics without location filtering"""
    try:
        clinics = list(clinics_collection.find({}, {"_id": 0}).limit(limit))
        return clinics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clinics/search")
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
                "query": query,
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

@router.post("/clinics")
async def add_clinic(clinic: Clinic):
    """Add a new clinic to the database"""
    try:
        clinic_dict = clinic.dict()
        result = clinics_collection.insert_one(clinic_dict)
        return {"message": "Clinic added successfully", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/clinics/{clinic_id}")
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