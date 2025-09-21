from fastapi import APIRouter, HTTPException
from app.models.clinic import ChatQuery
from app.services.ai import model, generate_review
from app.services.database import clinics_collection

router = APIRouter()

@router.post("/chat")
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


@router.get("/clinic-analysis/{clinic_name}")
async def get_clinic_analysis(clinic_name: str):
    """Generate AI analysis of clinic reviews and patient experiences"""
    try:
        # Find the clinic in the database
        clinic = clinics_collection.find_one({"name": {"$regex": clinic_name, "$options": "i"}})

        if not clinic:
            raise HTTPException(status_code=404, detail="Clinic not found")

        # For now, generate a generic analysis since we don't have real reviews
        # In a real implementation, you would fetch actual reviews from Google Places API
        sample_reviews = [
            "Great staff and affordable pricing options available.",
            "Clean facilities and professional service.",
            "Wait times can be long but the care is worth it.",
            "Sliding scale pricing makes healthcare accessible."
        ]

        analysis = generate_review(clinic_name, sample_reviews)

        return {
            "clinic_name": clinic_name,
            "analysis": analysis,
            "force_refresh": False
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating clinic analysis: {str(e)}")