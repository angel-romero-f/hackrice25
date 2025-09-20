from typing import Optional, List
from pydantic import BaseModel

class ChatQuery(BaseModel):
    message: str
    context: Optional[str] = None

# Enhanced Chatbot Models
class ChatBotMessage(BaseModel):
    session_id: Optional[str] = None
    message: str
    user_id: Optional[str] = None

class ChatBotResponse(BaseModel):
    response: str
    session_id: str
    intent: str
    conversation_state: str
    user_location: Optional[str] = None
    disclaimer: str
    suggestions: List[str] = []

class ChatSessionCreate(BaseModel):
    user_id: Optional[str] = None

class ChatSessionSummary(BaseModel):
    session_id: str
    message_count: int
    current_state: str
    user_location: Optional[str] = None
    session_duration_minutes: int
    last_activity: str
    user_preferences: dict = {}