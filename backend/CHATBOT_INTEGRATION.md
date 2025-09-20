# ChatBot Integration Guide for Care Compass

## Overview

The advanced AI chatbot service provides healthcare navigation assistance with conversation memory, intent classification, and specialized healthcare prompts. This guide shows how to integrate the chatbot into your existing FastAPI application.

## Architecture

### Core Components

1. **ChatBotService** (`app/services/chat_bot.py`)
   - Main service class with conversation management
   - Session handling with timeout management
   - Intent classification for healthcare contexts
   - Specialized prompt templates for different scenarios

2. **API Routes** (`app/routes/chatbot.py`)
   - RESTful endpoints for chatbot interactions
   - Session management endpoints
   - Quick action endpoints for common interactions
   - Admin endpoints for maintenance

3. **Data Models** (`app/models/clinic.py`)
   - Pydantic models for request/response validation
   - Type safety for chatbot interactions

## Integration Steps

### 1. Add Chatbot Routes to Main Application

Update `app/main.py` to include the chatbot routes:

```python
from app.routes import chatbot

# Add this line with your other route includes
app.include_router(chatbot.router)
```

### 2. Environment Variables

Ensure these variables are set in your `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Dependencies

The chatbot uses the existing dependencies in `requirements.txt`:
- `google-generativeai>=0.3.2` (already included)
- Standard FastAPI dependencies

## API Endpoints

### Session Management

```
POST /chatbot/session
- Create new chat session
- Returns: session_id and welcome message

GET /chatbot/session/{session_id}
- Get session summary and statistics

DELETE /chatbot/session/{session_id}
- End chat session and cleanup
```

### Message Handling

```
POST /chatbot/message
- Send message and get AI response
- Auto-creates session if none provided
- Returns: AI response with context and suggestions
```

### Quick Actions

```
POST /chatbot/quick-actions/find-clinics
POST /chatbot/quick-actions/emergency-help
POST /chatbot/quick-actions/insurance-help
- Pre-built interactions for common scenarios
```

### Admin/Monitoring

```
GET /chatbot/health
- Health check for chatbot service

GET /chatbot/stats
- Usage statistics and metrics

POST /chatbot/sessions/cleanup
- Clean up expired sessions
```

## Usage Examples

### Basic Chat Flow

```python
# 1. Create session
response = requests.post("/chatbot/session", json={"user_id": "optional_user_id"})
session_id = response.json()["session_id"]

# 2. Send message
message_data = {
    "session_id": session_id,
    "message": "I need to find a free clinic in Houston",
    "user_id": "optional_user_id"
}
response = requests.post("/chatbot/message", json=message_data)

# 3. Get AI response
ai_response = response.json()
print(ai_response["response"])
print(ai_response["suggestions"])  # Quick reply options
```

### Frontend Integration Pattern

```javascript
// Frontend chatbot widget integration example
class ChatBotWidget {
    constructor() {
        this.sessionId = null;
        this.apiBase = '/chatbot';
    }

    async startSession() {
        const response = await fetch(`${this.apiBase}/session`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({})
        });
        const data = await response.json();
        this.sessionId = data.session_id;
        return data.welcome_message;
    }

    async sendMessage(message) {
        const response = await fetch(`${this.apiBase}/message`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                session_id: this.sessionId,
                message: message
            })
        });
        return await response.json();
    }
}
```

## Features

### Conversation States

The chatbot tracks conversation context through states:
- `GREETING` - Initial welcome
- `LOCATION_SEARCH` - Finding clinics by location
- `SERVICE_INQUIRY` - Asking about healthcare services
- `CLINIC_DISCUSSION` - Discussing specific clinics
- `INSURANCE_HELP` - Cost and insurance questions
- `EMERGENCY_GUIDANCE` - Emergency medical situations
- `GENERAL_HEALTH` - General health questions

### Intent Classification

Automatic classification of user messages:
- Location-based searches
- Service inquiries
- Insurance/cost concerns
- Emergency situations
- Clinic-specific questions

### Specialized Prompts

Healthcare-specific prompt templates:
- Empathetic, non-judgmental responses
- Focus on practical guidance
- Clear disclaimers about medical advice
- Emergency safety prioritization

### Memory Management

- Conversation history (last 20 messages)
- Session timeout (60 minutes default)
- Automatic cleanup of expired sessions
- User location and preferences storage

## Security Considerations

1. **No Personal Health Information (PHI)**
   - Chatbot does not store medical information
   - Conversations are not permanently stored
   - Session data expires automatically

2. **Rate Limiting**
   - Consider implementing rate limiting on message endpoints
   - Monitor usage to prevent abuse

3. **Input Validation**
   - All inputs validated through Pydantic models
   - Sanitization of user messages

## Monitoring and Maintenance

### Health Checks

```bash
# Check chatbot health
curl GET /chatbot/health

# Get usage statistics
curl GET /chatbot/stats
```

### Session Cleanup

```bash
# Manual cleanup of expired sessions
curl POST /chatbot/sessions/cleanup
```

### Logging

The chatbot service includes error handling and logging. Monitor logs for:
- Gemini API errors
- Session management issues
- Intent classification failures

## Customization

### Adding New Intents

1. Update `HealthcareIntentClassifier.INTENT_KEYWORDS`
2. Add new prompt template in `PromptTemplates`
3. Update conversation state handling

### Modifying Prompts

Update prompt templates in `PromptTemplates` class:
- `BASE_SYSTEM_PROMPT` - Core chatbot personality
- Specific prompts for each conversation state

### Session Timeout

Modify `session_timeout_minutes` in `ChatBotService.__init__()`

## Production Considerations

1. **Persistent Storage**
   - Current implementation uses in-memory storage
   - For production, implement Redis or database storage
   - Add session persistence across server restarts

2. **Scalability**
   - Consider horizontal scaling with shared session storage
   - Implement connection pooling for Gemini API

3. **Monitoring**
   - Add comprehensive logging
   - Implement metrics collection
   - Set up alerts for service health

## Integration with Existing Features

The chatbot can integrate with existing Care Compass features:

1. **Clinic Search Integration**
   - Use existing `POST /clinics/search` endpoint
   - Incorporate real clinic data in responses

2. **Location Services**
   - Leverage existing Google Maps integration
   - Use geocoding for location extraction

3. **AI Services**
   - Builds on existing Gemini integration
   - Shares API configuration and error handling

This chatbot service provides a robust foundation for healthcare navigation assistance while maintaining the privacy and safety standards required for healthcare applications.