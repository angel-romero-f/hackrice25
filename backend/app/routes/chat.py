from fastapi import APIRouter, HTTPException
from app.models.clinic import ChatQuery
from app.services.ai import model

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