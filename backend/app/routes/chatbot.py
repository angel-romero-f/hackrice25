"""
ChatBot API Routes for Care Compass
Advanced chatbot with conversation management and healthcare-specific responses
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any

from app.models.chatbot import (
    ChatBotMessage,
    ChatBotResponse,
    ChatSessionCreate,
    ChatSessionSummary
)
from app.services.chatbot import chatbot_service

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/session", response_model=Dict[str, str])
async def create_chat_session(session_data: ChatSessionCreate):
    """Create a new chat session for the user"""
    try:
        session_id = chatbot_service.create_session(session_data.user_id)

        return {
            "session_id": session_id,
            "message": "Chat session created successfully",
            "welcome_message": "Hello! I'm CareBot, your healthcare navigator. How can I help you find affordable healthcare today?"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")


@router.post("/message", response_model=ChatBotResponse)
async def send_message(message_data: ChatBotMessage):
    """Send a message to the chatbot and get a response"""
    try:
        # If no session_id provided, create a new session
        if not message_data.session_id:
            session_id = chatbot_service.create_session(message_data.user_id)
        else:
            session_id = message_data.session_id

        # Process the message
        result = await chatbot_service.process_message(session_id, message_data.message)

        if "error" in result:
            if result.get("suggested_action") == "start_new_session":
                # Auto-create new session and retry
                new_session_id = chatbot_service.create_session(message_data.user_id)
                result = await chatbot_service.process_message(new_session_id, message_data.message)
                if "error" in result:
                    raise HTTPException(status_code=500, detail=result["error"])
            else:
                raise HTTPException(status_code=500, detail=result["error"])

        return ChatBotResponse(**result)

    except Exception as e:
        # Fallback response for any errors
        fallback_response = {
            "response": "I apologize, but I'm having trouble right now. For medical emergencies, please call 911. Otherwise, please try your question again.",
            "session_id": message_data.session_id or "error",
            "intent": "error_handling",
            "conversation_state": "error",
            "disclaimer": "For medical emergencies, call 911. This is not medical advice.",
            "suggestions": ["Try again", "Find emergency care", "Start over"]
        }
        return ChatBotResponse(**fallback_response)


@router.get("/session/{session_id}", response_model=ChatSessionSummary)
async def get_session_summary(session_id: str):
    """Get summary information about a chat session"""
    try:
        summary = chatbot_service.get_session_summary(session_id)

        if "error" in summary:
            raise HTTPException(status_code=404, detail=summary["error"])

        return ChatSessionSummary(**summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get session summary: {str(e)}")


@router.delete("/session/{session_id}")
async def end_chat_session(session_id: str):
    """End a chat session and clean up resources"""
    try:
        session = chatbot_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        chatbot_service.cleanup_session(session_id)

        return {
            "message": "Session ended successfully",
            "session_id": session_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")


@router.post("/sessions/cleanup")
async def cleanup_expired_sessions(background_tasks: BackgroundTasks):
    """Clean up expired chat sessions (admin endpoint)"""
    try:
        background_tasks.add_task(chatbot_service.cleanup_expired_sessions)

        return {
            "message": "Session cleanup started in background"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start cleanup: {str(e)}")


@router.get("/health")
async def chatbot_health_check():
    """Health check for chatbot service"""
    try:
        # Check if the service is working
        active_sessions = len(chatbot_service.active_sessions)

        return {
            "status": "healthy",
            "service": "chatbot",
            "active_sessions": active_sessions,
            "gemini_configured": bool(chatbot_service.model),
            "session_timeout_minutes": chatbot_service.session_timeout_minutes
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "chatbot",
            "error": str(e)
        }

# Quick actions endpoints for common chatbot interactions
@router.post("/quick-actions/find-clinics")
async def quick_find_clinics(session_id: str, location: str):
    """Quick action to find clinics near a location"""
    try:
        message = f"Find clinics near {location}"
        result = await chatbot_service.process_message(session_id, message)

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find clinics: {str(e)}")


@router.post("/quick-actions/emergency-help")
async def quick_emergency_help(session_id: str):
    """Quick action for emergency guidance"""
    try:
        message = "I need emergency help"
        result = await chatbot_service.process_message(session_id, message)

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to provide emergency help: {str(e)}")


@router.post("/quick-actions/insurance-help")
async def quick_insurance_help(session_id: str):
    """Quick action for insurance and cost help"""
    try:
        message = "I don't have insurance and need help with costs"
        result = await chatbot_service.process_message(session_id, message)

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to provide insurance help: {str(e)}")

@router.post("/clinic-analysis/{clinic_name}")
async def analyze_clinic_reviews(clinic_name: str, force_refresh: bool = False):
    """Analyze clinic reviews with caching support"""
    try:
        if force_refresh:
            result = await chatbot_service.refresh_clinic_review_cache(clinic_name)
        else:
            result = await chatbot_service.find_and_analyze_clinic(clinic_name)

        return {
            "clinic_name": clinic_name,
            "analysis": result,
            "force_refresh": force_refresh
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze clinic: {str(e)}")

@router.get("/clinic-cache-status/{clinic_name}")
async def get_clinic_cache_status(clinic_name: str):
    """Check cache status for a clinic"""
    try:
        clinic_doc = await chatbot_service.find_clinic_in_database(clinic_name)

        if not clinic_doc:
            return {
                "clinic_name": clinic_name,
                "found_in_database": False,
                "cache_status": "not_found"
            }

        review_analysis = clinic_doc.get('review_analysis')
        if not review_analysis:
            return {
                "clinic_name": clinic_doc.get('name'),
                "found_in_database": True,
                "cache_status": "no_cache",
                "review_analysis": None
            }

        is_valid = chatbot_service.is_review_cache_valid(clinic_doc)

        return {
            "clinic_name": clinic_doc.get('name'),
            "found_in_database": True,
            "cache_status": "valid" if is_valid else "expired",
            "review_analysis": {
                "last_analyzed": review_analysis.get('last_analyzed'),
                "cache_expires_at": review_analysis.get('cache_expires_at'),
                "analysis_confidence": review_analysis.get('analysis_confidence'),
                "total_reviews": review_analysis.get('total_reviews'),
                "google_rating": review_analysis.get('google_rating')
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check cache status: {str(e)}")