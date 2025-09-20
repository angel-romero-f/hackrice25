"""
Advanced AI Chatbot Service for Care Compass
Healthcare navigation assistant with conversation memory and specialized prompts
"""

import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from enum import Enum

import google.generativeai as genai
from app.config import GEMINI_API_KEY
from app.services.database import clinics_collection

class ConversationState(Enum):
    """States for tracking conversation context"""
    GREETING = "greeting"
    LOCATION_SEARCH = "location_search"
    SERVICE_INQUIRY = "service_inquiry"
    CLINIC_DISCUSSION = "clinic_discussion"
    INSURANCE_HELP = "insurance_help"
    EMERGENCY_GUIDANCE = "emergency_guidance"
    GENERAL_HEALTH = "general_health"
    CLOSING = "closing"


@dataclass
class ChatMessage:
    """Individual chat message with metadata"""
    id: str
    content: str
    role: str  # 'user' or 'assistant'
    timestamp: datetime
    intent: Optional[str] = None
    context_data: Optional[Dict[str, Any]] = None


@dataclass
class ChatSession:
    """Chat session with conversation history and context"""
    session_id: str
    user_id: Optional[str]
    messages: List[ChatMessage]
    current_state: ConversationState
    user_location: Optional[str]
    user_preferences: Dict[str, Any]
    session_data: Dict[str, Any]
    created_at: datetime
    last_activity: datetime
    is_active: bool = True


class HealthcareIntentClassifier:
    """Classifies user intents for healthcare conversations"""

    INTENT_KEYWORDS = {
        'location_search': ['near me', 'zip code', 'address', 'location', 'where', 'find clinic'],
        'service_inquiry': ['checkup', 'doctor', 'urgent care', 'mental health', 'dental', 'eye care'],
        'insurance_help': ['insurance', 'uninsured', 'cost', 'pay', 'free', 'sliding scale'],
        'emergency_guidance': ['emergency', 'urgent', 'pain', 'bleeding', 'chest pain', '911'],
        'clinic_discussion': ['clinic', 'hospital', 'appointment', 'hours', 'phone'],
        'general_health': ['symptoms', 'condition', 'treatment', 'medication', 'advice']
    }

    @classmethod
    def classify_intent(cls, message: str) -> str:
        """Basic intent classification based on keywords"""
        message_lower = message.lower()

        for intent, keywords in cls.INTENT_KEYWORDS.items():
            if any(keyword in message_lower for keyword in keywords):
                return intent

        return 'general_health'


class PromptTemplates:
    """Healthcare-specific prompt templates for different conversation contexts"""

    BASE_SYSTEM_PROMPT = """
    You are CareBot, a compassionate AI healthcare navigator for Care Compass. Your mission is to help uninsured individuals find affordable healthcare options.

    CORE PRINCIPLES:
    - Be empathetic and non-judgmental
    - Use simple, clear language
    - Focus on practical, actionable guidance
    - Never provide medical diagnosis or specific medical advice
    - Always emphasize emergency services when appropriate
    - Prioritize user safety and well-being

    CAPABILITIES:
    - Help find free and low-cost clinics
    - Explain healthcare rights and patient protections
    - Guide users through healthcare access options
    - Provide general health education
    - Connect users to community resources

    LIMITATIONS:
    - Cannot diagnose medical conditions
    - Cannot prescribe medications
    - Cannot replace professional medical consultation
    - Cannot provide emergency medical care
    """

    GREETING_PROMPT = """
    Respond as a warm, welcoming healthcare navigator. Ask how you can help them find affordable healthcare today.
    Keep the greeting brief (1-2 sentences) and immediately focus on how you can assist.
    """

    LOCATION_SEARCH_PROMPT = """
    The user is looking for healthcare near a specific location. Help them understand:
    - How to search for clinics in their area
    - What information they'll need (ZIP code, city, or address)
    - What types of facilities might be available

    If they mention a location, offer to help them search for clinics there.
    """

    SERVICE_INQUIRY_PROMPT = """
    The user is asking about specific healthcare services. Provide guidance on:
    - Types of services available at community health centers
    - Difference between urgent care, primary care, and emergency care
    - What to expect during different types of appointments
    - How to prepare for their visit

    Focus on free and low-cost options.
    """

    INSURANCE_HELP_PROMPT = """
    The user needs help with insurance or cost concerns. Address:
    - Options for uninsured individuals
    - Sliding scale payment programs
    - Community health centers and FQHCs
    - Patient financial assistance programs
    - Medicaid eligibility basics

    Emphasize that healthcare is available regardless of insurance status.
    """

    EMERGENCY_GUIDANCE_PROMPT = """
    This appears to be an emergency or urgent medical situation.

    IMMEDIATELY provide:
    1. "For medical emergencies, call 911 immediately"
    2. Signs that require emergency care
    3. Urgent care vs emergency room guidance
    4. How to handle the situation if they cannot afford emergency care

    Prioritize safety over cost concerns.
    """

    CLINIC_DISCUSSION_PROMPT = """
    The user is discussing specific clinics or healthcare facilities. Help them:
    - Understand what services are offered
    - Know what to expect during their visit
    - Prepare questions to ask the healthcare provider
    - Understand their rights as a patient
    - Find contact information and hours
    """


class ChatBotService:
    """Main chatbot service with conversation management and AI integration"""

    def __init__(self):
        # Configure Gemini AI
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

        # In-memory session storage (in production, use Redis or database)
        self.active_sessions: Dict[str, ChatSession] = {}
        self.session_timeout_minutes = 60

        # Intent classifier
        self.intent_classifier = HealthcareIntentClassifier()

        # Prompt templates
        self.prompts = PromptTemplates()

    def create_session(self, user_id: Optional[str] = None) -> str:
        """Create a new chat session"""
        session_id = str(uuid.uuid4())

        session = ChatSession(
            session_id=session_id,
            user_id=user_id,
            messages=[],
            current_state=ConversationState.GREETING,
            user_location=None,
            user_preferences={},
            session_data={},
            created_at=datetime.utcnow(),
            last_activity=datetime.utcnow()
        )

        self.active_sessions[session_id] = session
        return session_id

    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Retrieve and validate session"""
        session = self.active_sessions.get(session_id)

        if not session:
            return None

        # Check if session has expired
        if datetime.utcnow() - session.last_activity > timedelta(minutes=self.session_timeout_minutes):
            self.cleanup_session(session_id)
            return None

        return session

    def cleanup_session(self, session_id: str) -> None:
        """Clean up expired or closed session"""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]

    def update_session_activity(self, session: ChatSession) -> None:
        """Update session last activity timestamp"""
        session.last_activity = datetime.utcnow()

    def add_message_to_session(self, session: ChatSession, content: str, role: str, intent: Optional[str] = None) -> ChatMessage:
        """Add a message to the conversation history"""
        message = ChatMessage(
            id=str(uuid.uuid4()),
            content=content,
            role=role,
            timestamp=datetime.utcnow(),
            intent=intent
        )

        session.messages.append(message)
        self.update_session_activity(session)

        # Keep only last 20 messages to manage memory
        if len(session.messages) > 20:
            session.messages = session.messages[-20:]

        return message

    def get_conversation_context(self, session: ChatSession, include_messages: int = 5) -> str:
        """Build conversation context for AI prompts"""
        if not session.messages:
            return ""

        recent_messages = session.messages[-include_messages:]
        context_parts = []

        for msg in recent_messages:
            role_label = "User" if msg.role == "user" else "Assistant"
            context_parts.append(f"{role_label}: {msg.content}")

        return "\n".join(context_parts)

    def extract_location_from_message(self, message: str) -> Optional[str]:
        """Extract location information from user message"""
        import re

        # Look for ZIP codes
        zip_pattern = r'\b\d{5}(?:-\d{4})?\b'
        zip_match = re.search(zip_pattern, message)
        if zip_match:
            return zip_match.group()

        # Look for city/state patterns
        city_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*(?:TX|Texas|tx)\b'
        city_match = re.search(city_pattern, message)
        if city_match:
            return city_match.group()

        return None

    def update_conversation_state(self, session: ChatSession, user_message: str, intent: str) -> None:
        """Update conversation state based on user intent"""
        current_state = session.current_state

        # State transitions based on intent
        if intent == 'emergency_guidance':
            session.current_state = ConversationState.EMERGENCY_GUIDANCE
        elif intent == 'location_search':
            session.current_state = ConversationState.LOCATION_SEARCH
            # Extract and store location if found
            location = self.extract_location_from_message(user_message)
            if location:
                session.user_location = location
        elif intent == 'service_inquiry':
            session.current_state = ConversationState.SERVICE_INQUIRY
        elif intent == 'clinic_discussion':
            session.current_state = ConversationState.CLINIC_DISCUSSION
        elif intent == 'insurance_help':
            session.current_state = ConversationState.INSURANCE_HELP
        elif current_state == ConversationState.GREETING:
            session.current_state = ConversationState.GENERAL_HEALTH

    def build_contextual_prompt(self, session: ChatSession, user_message: str, intent: str) -> str:
        """Build a contextual prompt based on conversation state and intent"""
        base_prompt = self.prompts.BASE_SYSTEM_PROMPT

        # Get state-specific prompt
        state_prompts = {
            ConversationState.GREETING: self.prompts.GREETING_PROMPT,
            ConversationState.LOCATION_SEARCH: self.prompts.LOCATION_SEARCH_PROMPT,
            ConversationState.SERVICE_INQUIRY: self.prompts.SERVICE_INQUIRY_PROMPT,
            ConversationState.INSURANCE_HELP: self.prompts.INSURANCE_HELP_PROMPT,
            ConversationState.EMERGENCY_GUIDANCE: self.prompts.EMERGENCY_GUIDANCE_PROMPT,
            ConversationState.CLINIC_DISCUSSION: self.prompts.CLINIC_DISCUSSION_PROMPT,
        }

        specific_prompt = state_prompts.get(session.current_state, "")

        # Build context information
        context_parts = [base_prompt, specific_prompt]

        # Add conversation history
        conversation_context = self.get_conversation_context(session)
        if conversation_context:
            context_parts.append(f"\nConversation History:\n{conversation_context}")

        # Add user location context if available
        if session.user_location:
            context_parts.append(f"\nUser Location: {session.user_location}")

        # Add current user message
        context_parts.append(f"\nCurrent User Message: {user_message}")
        context_parts.append("\nRespond helpfully and compassionately:")

        return "\n".join(context_parts)

    async def get_nearby_clinics_context(self, location: str, limit: int = 3) -> str:
        """Get nearby clinics to provide context for recommendations"""
        try:
            # This would integrate with the existing clinic search functionality
            # For now, return a placeholder
            return f"Searching for clinics near {location}..."
        except Exception:
            return "I can help you search for clinics once you provide a location."

    async def process_message(self, session_id: str, message: str) -> Dict[str, Any]:
        """Process user message and generate AI response"""
        # Get or create session
        session = self.get_session(session_id)
        if not session:
            return {
                "error": "Session not found or expired",
                "suggested_action": "start_new_session"
            }

        try:
            # Classify user intent
            intent = self.intent_classifier.classify_intent(message)

            # Add user message to session
            self.add_message_to_session(session, message, "user", intent)

            # Update conversation state
            self.update_conversation_state(session, message, intent)

            # Build contextual prompt
            prompt = self.build_contextual_prompt(session, message, intent)

            # Generate AI response
            response = self.model.generate_content(prompt)
            ai_response = response.text

            # Add AI response to session
            self.add_message_to_session(session, ai_response, "assistant")

            # Prepare response with metadata
            result = {
                "response": ai_response,
                "session_id": session_id,
                "intent": intent,
                "conversation_state": session.current_state.value,
                "user_location": session.user_location,
                "disclaimer": "This is general information only. For medical emergencies, call 911. This is not medical advice.",
                "suggestions": self._generate_quick_replies(session, intent)
            }

            return result

        except Exception as e:
            # Add error handling
            error_response = "I apologize, but I'm having trouble processing your message right now. Please try again, or if this is an emergency, call 911 immediately."
            self.add_message_to_session(session, error_response, "assistant")

            return {
                "response": error_response,
                "session_id": session_id,
                "error": str(e),
                "disclaimer": "For medical emergencies, call 911."
            }

    def _generate_quick_replies(self, session: ChatSession, intent: str) -> List[str]:
        """Generate contextual quick reply suggestions"""
        base_suggestions = [
            "Find clinics near me",
            "I need help with costs",
            "What services are available?",
        ]

        intent_suggestions = {
            'location_search': [
                "Show me free clinics",
                "What about urgent care?",
                "Mental health services"
            ],
            'insurance_help': [
                "Sliding scale options",
                "Community health centers",
                "Medicaid information"
            ],
            'emergency_guidance': [
                "Urgent care locations",
                "What if I can't afford ER?",
                "Non-emergency options"
            ]
        }

        return intent_suggestions.get(intent, base_suggestions)

    def get_session_summary(self, session_id: str) -> Dict[str, Any]:
        """Get session summary and statistics"""
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found"}

        return {
            "session_id": session_id,
            "message_count": len(session.messages),
            "current_state": session.current_state.value,
            "user_location": session.user_location,
            "session_duration_minutes": int((datetime.utcnow() - session.created_at).total_seconds() / 60),
            "last_activity": session.last_activity.isoformat(),
            "user_preferences": session.user_preferences
        }

    def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions and return count of cleaned sessions"""
        expired_sessions = []
        cutoff_time = datetime.utcnow() - timedelta(minutes=self.session_timeout_minutes)

        for session_id, session in self.active_sessions.items():
            if session.last_activity < cutoff_time:
                expired_sessions.append(session_id)

        for session_id in expired_sessions:
            del self.active_sessions[session_id]

        return len(expired_sessions)


# Global chatbot service instance
chatbot_service = ChatBotService()