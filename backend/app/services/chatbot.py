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
import googlemaps
from app.config import GEMINI_API_KEY, GOOGLE_MAPS_API_KEY
from app.services.database import clinics_collection, chat_sessions_collection

class ConversationState(Enum):
    """States for tracking conversation context"""
    GREETING = "greeting"
    LOCATION_SEARCH = "location_search"
    SERVICE_INQUIRY = "service_inquiry"
    CLINIC_DISCUSSION = "clinic_discussion"
    CLINIC_ANALYSIS = "clinic_analysis"
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

    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary for MongoDB storage"""
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "messages": [
                {
                    "id": msg.id,
                    "content": msg.content,
                    "role": msg.role,
                    "timestamp": msg.timestamp,
                    "intent": msg.intent,
                    "context_data": msg.context_data
                } for msg in self.messages
            ],
            "current_state": self.current_state.value,
            "user_location": self.user_location,
            "user_preferences": self.user_preferences,
            "session_data": self.session_data,
            "created_at": self.created_at,
            "last_activity": self.last_activity,
            "is_active": self.is_active
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ChatSession':
        """Create ChatSession from MongoDB document"""
        messages = []
        for msg_data in data.get("messages", []):
            messages.append(ChatMessage(
                id=msg_data["id"],
                content=msg_data["content"],
                role=msg_data["role"],
                timestamp=msg_data["timestamp"],
                intent=msg_data.get("intent"),
                context_data=msg_data.get("context_data")
            ))

        return cls(
            session_id=data["session_id"],
            user_id=data.get("user_id"),
            messages=messages,
            current_state=ConversationState(data["current_state"]),
            user_location=data.get("user_location"),
            user_preferences=data.get("user_preferences", {}),
            session_data=data.get("session_data", {}),
            created_at=data["created_at"],
            last_activity=data["last_activity"],
            is_active=data.get("is_active", True)
        )


class HealthcareIntentClassifier:
    """Classifies user intents for healthcare conversations"""

    INTENT_KEYWORDS = {
        'location_search': ['near me', 'zip code', 'address', 'location', 'where', 'find clinic'],
        'service_inquiry': ['checkup', 'doctor', 'urgent care', 'mental health', 'dental', 'eye care'],
        'insurance_help': ['insurance', 'uninsured', 'cost', 'pay', 'free', 'sliding scale'],
        'emergency_guidance': ['emergency', 'urgent', 'pain', 'bleeding', 'chest pain', '911'],
        'clinic_discussion': ['clinic', 'hospital', 'appointment', 'hours', 'phone'],
        'clinic_analysis': ['tell me about', 'reviews', 'what is', 'experiences', 'good clinic', 'recommend', 'thoughts on'],
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

    CLINIC_ANALYSIS_PROMPT = """
    The user wants to know about a specific clinic's reputation, reviews, or patient experiences.

    You have the ability to fetch and analyze real patient reviews for clinics. When they mention a clinic name:
    - Offer to look up reviews and patient experiences
    - Provide analysis of what patients say about their experiences
    - Give balanced insights about strengths and potential concerns
    - Help them understand what to expect based on other patients' experiences

    Focus on practical insights that help them make informed healthcare decisions.
    """


class ChatBotService:
    """Main chatbot service with conversation management and AI integration"""

    def __init__(self):
        # Configure Gemini AI
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

        # Configure Google Maps for review fetching
        self.gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)

        # In-memory session storage (in production, use Redis or database)
        self.active_sessions: Dict[str, ChatSession] = {}
        self.session_timeout_minutes = 60

        # Intent classifier
        self.intent_classifier = HealthcareIntentClassifier()

        # Prompt templates
        self.prompts = PromptTemplates()

    def _save_session_to_db(self, session: ChatSession) -> None:
        """Save session to MongoDB"""
        try:
            if chat_sessions_collection is not None:
                session_doc = session.to_dict()
                chat_sessions_collection.replace_one(
                    {"session_id": session.session_id},
                    session_doc,
                    upsert=True
                )
        except Exception as e:
            print(f"Error saving session to database: {e}")

    def _load_session_from_db(self, session_id: str) -> Optional[ChatSession]:
        """Load session from MongoDB"""
        try:
            if chat_sessions_collection is not None:
                session_doc = chat_sessions_collection.find_one({"session_id": session_id})
                if session_doc:
                    return ChatSession.from_dict(session_doc)
            return None
        except Exception as e:
            print(f"Error loading session from database: {e}")
            return None

    def _delete_session_from_db(self, session_id: str) -> None:
        """Delete session from MongoDB"""
        try:
            if chat_sessions_collection is not None:
                chat_sessions_collection.delete_one({"session_id": session_id})
        except Exception as e:
            print(f"Error deleting session from database: {e}")

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

        # Save to both memory (for caching) and database (for persistence)
        self.active_sessions[session_id] = session
        self._save_session_to_db(session)
        return session_id

    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Retrieve and validate session from memory cache or database"""
        # First, try to get from memory cache
        session = self.active_sessions.get(session_id)

        # If not in memory, try loading from database
        if not session:
            session = self._load_session_from_db(session_id)
            if session:
                # Add back to memory cache for faster access
                self.active_sessions[session_id] = session

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

        # Also remove from database
        self._delete_session_from_db(session_id)

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

        # Save updated session to database
        self._save_session_to_db(session)

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

    def extract_clinic_name_from_message(self, message: str) -> Optional[str]:
        """Extract potential clinic names from user message"""
        import re

        # Look for patterns that might indicate clinic names
        clinic_patterns = [
            r'(.*?(?:clinic|medical|health|urgent care|hospital|center).*?)(?:\s|$)',
            r'(?:at|to|about)\s+([A-Z][a-zA-Z\s&.-]+(?:clinic|medical|health|urgent care|hospital|center))',
            r'([A-Z][a-zA-Z\s&.-]+(?:urgent care|medical center|clinic|hospital))',
        ]

        message_cleaned = re.sub(r'\b(?:the|a|an)\b', '', message, flags=re.IGNORECASE)

        for pattern in clinic_patterns:
            matches = re.finditer(pattern, message_cleaned, re.IGNORECASE)
            for match in matches:
                clinic_name = match.group(1).strip()
                if len(clinic_name) > 3 and len(clinic_name) < 50:  # Reasonable length
                    return clinic_name

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
        elif intent == 'clinic_analysis':
            session.current_state = ConversationState.CLINIC_ANALYSIS
            # Extract and store clinic name if found
            clinic_name = self.extract_clinic_name_from_message(user_message)
            if clinic_name:
                session.session_data['current_clinic'] = clinic_name
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
            ConversationState.CLINIC_ANALYSIS: self.prompts.CLINIC_ANALYSIS_PROMPT,
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

    async def fetch_clinic_reviews(self, clinic_name: str, clinic_address: str = None) -> Dict[str, Any]:
        """Fetch reviews for a clinic using Google Places API"""
        try:
            # Search for the clinic
            search_query = clinic_name
            if clinic_address:
                search_query += f" {clinic_address}"

            places_result = self.gmaps.places(query=search_query)

            if not places_result.get('results'):
                return {"reviews": [], "place_id": None, "error": "Clinic not found"}

            place = places_result['results'][0]
            place_id = place.get('place_id')

            if not place_id:
                return {"reviews": [], "place_id": None, "error": "No place ID found"}

            # Get detailed place information including reviews
            place_details = self.gmaps.place(
                place_id=place_id,
                fields=['reviews', 'rating', 'user_ratings_total', 'name']
            )

            reviews = place_details.get('result', {}).get('reviews', [])

            return {
                "reviews": reviews,
                "place_id": place_id,
                "clinic_name": place_details.get('result', {}).get('name', clinic_name),
                "rating": place_details.get('result', {}).get('rating'),
                "total_ratings": place_details.get('result', {}).get('user_ratings_total', 0)
            }

        except Exception as e:
            return {"reviews": [], "place_id": None, "error": str(e)}

    async def analyze_clinic_sentiment(self, clinic_name: str, review_data: Dict[str, Any]) -> str:
        """Generate sentiment analysis and clinic summary using Gemini"""
        try:
            reviews = review_data.get('reviews', [])
            clinic_rating = review_data.get('rating', 0)
            total_ratings = review_data.get('total_ratings', 0)

            if not reviews:
                return f"""
                **{clinic_name}** - Limited Review Data Available

                Google Rating: {clinic_rating}/5.0 ({total_ratings} reviews)

                I don't have enough detailed reviews to provide a comprehensive analysis of patient experiences at this clinic. However, based on the overall rating, this clinic appears to maintain reasonable patient satisfaction.

                I'd recommend calling them directly to ask about:
                - Services offered and wait times
                - Pricing and payment options
                - What to expect during your visit
                - Any specific concerns you might have

                Would you like me to help you prepare questions to ask when you call?
                """

            # Prepare review text for analysis
            review_texts = []
            for review in reviews[:10]:  # Limit to 10 most recent reviews
                text = review.get('text', '')
                rating = review.get('rating', 0)
                if text:
                    review_texts.append(f"Rating: {rating}/5 - {text}")

            combined_reviews = "\n\n".join(review_texts)

            prompt = f"""
            You are analyzing patient reviews for {clinic_name}, a healthcare facility. Create a helpful, balanced summary for someone considering visiting this clinic.

            CLINIC INFORMATION:
            - Name: {clinic_name}
            - Google Rating: {clinic_rating}/5.0 stars
            - Total Reviews: {total_ratings}

            PATIENT REVIEWS:
            {combined_reviews}

            Please provide a conversational, helpful summary that includes:

            1. **Overall Patient Experience** (2-3 sentences)
            - What patients generally say about their experience
            - Overall tone and satisfaction level

            2. **Key Strengths** (2-4 bullet points)
            - What patients consistently praise
            - Specific positive aspects mentioned

            3. **Areas to Be Aware Of** (1-3 bullet points, if mentioned)
            - Common concerns or issues patients mention
            - Be balanced and fair, not overly negative

            4. **What to Expect** (2-3 sentences)
            - Help the user understand what their visit might be like
            - Practical insights from patient experiences

            5. **Bottom Line Recommendation** (1-2 sentences)
            - Balanced assessment of whether this seems like a good option
            - Any specific advice for potential patients

            Write in a conversational, supportive tone as if you're helping a friend choose healthcare. Focus on practical insights that would help someone make an informed decision. Be honest but compassionate, and remember this person may have limited healthcare options.

            Format with clear headers and bullet points for easy reading.
            """

            response = self.model.generate_content(prompt)
            return response.text

        except Exception as e:
            return f"""
            **{clinic_name}** - Analysis Unavailable

            I encountered an issue analyzing the reviews for this clinic: {str(e)}

            However, I can still help you by:
            - Providing general questions to ask when you call
            - Helping you understand what to expect at most clinics
            - Suggesting what information to gather before your visit

            Would you like help preparing for your visit to this clinic?
            """

    async def find_clinic_in_database(self, clinic_name: str) -> Optional[Dict[str, Any]]:
        """Find clinic in database by name (fuzzy matching)"""
        try:
            # Try exact match first
            clinic = clinics_collection.find_one({"name": {"$regex": f"^{clinic_name}$", "$options": "i"}})

            if clinic:
                return clinic

            # Try partial match
            clinic = clinics_collection.find_one({"name": {"$regex": clinic_name, "$options": "i"}})

            if clinic:
                return clinic

            # Try searching in services or notes
            clinic = clinics_collection.find_one({
                "$or": [
                    {"services": {"$regex": clinic_name, "$options": "i"}},
                    {"notes": {"$regex": clinic_name, "$options": "i"}}
                ]
            })

            return clinic

        except Exception as e:
            print(f"Error searching for clinic in database: {e}")
            return None

    def is_review_cache_valid(self, clinic_doc: Dict[str, Any]) -> bool:
        """Check if cached review analysis is still valid"""
        try:
            review_analysis = clinic_doc.get('review_analysis')
            if not review_analysis:
                return False

            cache_expires_at = review_analysis.get('cache_expires_at')
            if not cache_expires_at:
                return False

            # Parse expiration time
            expires_dt = datetime.fromisoformat(cache_expires_at.replace('Z', '+00:00'))
            return datetime.utcnow().replace(tzinfo=expires_dt.tzinfo) < expires_dt

        except Exception as e:
            print(f"Error checking cache validity: {e}")
            return False

    async def save_review_analysis_to_cache(self, clinic_doc: Dict[str, Any], review_data: Dict[str, Any], analysis_text: str) -> None:
        """Save review analysis to clinic document cache"""
        try:
            # Determine confidence level based on review count
            total_reviews = review_data.get('total_ratings', 0)
            if total_reviews >= 10:
                confidence = "high"
                cache_duration_days = 30  # Cache for 30 days
            elif total_reviews >= 3:
                confidence = "medium"
                cache_duration_days = 14  # Cache for 14 days
            else:
                confidence = "low"
                cache_duration_days = 7   # Cache for 7 days

            # Calculate cache expiration
            cache_expires_at = datetime.utcnow() + timedelta(days=cache_duration_days)

            # Prepare analysis data
            analysis_data = {
                "review_summary": analysis_text,
                "google_rating": review_data.get('rating'),
                "total_reviews": total_reviews,
                "last_analyzed": datetime.utcnow().isoformat(),
                "analysis_confidence": confidence,
                "cache_expires_at": cache_expires_at.isoformat()
            }

            # Update clinic document
            clinics_collection.update_one(
                {"_id": clinic_doc["_id"]},
                {"$set": {"review_analysis": analysis_data}}
            )

            print(f"Cached review analysis for {clinic_doc.get('name')} (expires: {cache_expires_at})")

        except Exception as e:
            print(f"Error saving review analysis to cache: {e}")

    async def find_and_analyze_clinic(self, clinic_name: str, clinic_address: str = None) -> str:
        """Complete workflow: find clinic, check cache, fetch reviews if needed, and generate analysis"""
        try:
            # First, try to find clinic in our database
            clinic_doc = await self.find_clinic_in_database(clinic_name)

            # Check if we have valid cached analysis
            if clinic_doc and self.is_review_cache_valid(clinic_doc):
                cached_analysis = clinic_doc.get('review_analysis', {})
                cached_summary = cached_analysis.get('review_summary')

                if cached_summary:
                    cache_info = f"\n\n*Using cached analysis from {cached_analysis.get('last_analyzed', 'recently')} - {cached_analysis.get('analysis_confidence', 'medium')} confidence*"
                    return cached_summary + cache_info

            # If no cache or expired, fetch fresh reviews
            review_data = await self.fetch_clinic_reviews(clinic_name, clinic_address)

            if review_data.get('error'):
                return f"""
                I had trouble finding detailed information about **{clinic_name}**.

                This could mean:
                - The clinic name might be slightly different
                - It might be a newer clinic with limited online presence
                - There might be multiple locations

                Can you help me by providing:
                - The full clinic name as it appears on their website or signage
                - The street address or neighborhood
                - Any other identifying information (like "urgent care" or "family practice")

                I'd be happy to try again with more specific information!
                """

            # Generate fresh analysis
            analysis = await self.analyze_clinic_sentiment(clinic_name, review_data)

            # Save to cache if we found the clinic in our database
            if clinic_doc:
                await self.save_review_analysis_to_cache(clinic_doc, review_data, analysis)
                cache_note = "\n\n*Fresh analysis saved to cache*"
                analysis += cache_note

            return analysis

        except Exception as e:
            return f"""
            I encountered an issue analyzing **{clinic_name}**: {str(e)}

            I can still help you by:
            - Answering general questions about what to expect at clinics
            - Helping you prepare questions to ask when you call
            - Providing guidance on choosing healthcare providers

            What would be most helpful for you right now?
            """

    async def refresh_clinic_review_cache(self, clinic_name: str, force: bool = False) -> str:
        """Force refresh the review analysis cache for a clinic"""
        try:
            clinic_doc = await self.find_clinic_in_database(clinic_name)

            if not clinic_doc:
                return f"Could not find **{clinic_name}** in our database to refresh cache."

            # Fetch fresh reviews regardless of cache status
            review_data = await self.fetch_clinic_reviews(clinic_name, clinic_doc.get('address'))

            if review_data.get('error'):
                return f"Could not fetch fresh reviews for **{clinic_name}**: {review_data['error']}"

            # Generate fresh analysis
            analysis = await self.analyze_clinic_sentiment(clinic_name, review_data)

            # Save to cache
            await self.save_review_analysis_to_cache(clinic_doc, review_data, analysis)

            return f"✅ **Cache refreshed for {clinic_name}**\n\n{analysis}"

        except Exception as e:
            return f"Error refreshing cache for **{clinic_name}**: {str(e)}"

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

            # Handle clinic analysis requests
            if intent == 'clinic_analysis':
                clinic_name = session.session_data.get('current_clinic')
                if not clinic_name:
                    # Try to extract clinic name from current message
                    clinic_name = self.extract_clinic_name_from_message(message)

                if clinic_name:
                    # Perform clinic analysis
                    ai_response = await self.find_and_analyze_clinic(clinic_name)
                else:
                    ai_response = """I'd be happy to help you learn about a specific clinic! Could you tell me the name of the clinic you're interested in?

For example:
- "Tell me about Houston Methodist Urgent Care"
- "What are the reviews like for Harris Health System?"
- "I'm considering AFC Urgent Care, what do patients say?"

The more specific you can be with the clinic name, the better information I can provide!"""
            else:
                # Build contextual prompt for other intents
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
            ],
            'clinic_analysis': [
                "Tell me about another clinic",
                "What should I ask when I call?",
                "Find more clinics like this"
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

        # Clean up from memory cache
        for session_id, session in self.active_sessions.items():
            if session.last_activity < cutoff_time:
                expired_sessions.append(session_id)

        for session_id in expired_sessions:
            del self.active_sessions[session_id]

        # Clean up expired sessions from database (beyond TTL)
        if chat_sessions_collection is not None:
            try:
                db_result = chat_sessions_collection.delete_many({
                    "last_activity": {"$lt": cutoff_time}
                })
                print(f"Cleaned up {db_result.deleted_count} expired sessions from database")
            except Exception as e:
                print(f"Error cleaning up database sessions: {e}")

        return len(expired_sessions)


# Global chatbot service instance
chatbot_service = ChatBotService()