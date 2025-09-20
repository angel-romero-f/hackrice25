# Care Compass - Claude Context File

## Project Overview
Care Compass is a hackathon project for HackRice 2025 addressing affordable healthcare access for uninsured individuals. The project focuses on social impact and justice, specifically helping people find free and low-cost healthcare options.

## Mission Statement
To connect uninsured individuals to affordable healthcare by providing:
- Free and sliding-scale clinic finder with location-based search
- AI-powered healthcare guidance in plain language
- Transparent pricing information for medical services
- Education about healthcare rights and eligibility programs

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB Atlas
- **AI**: Google Gemini Pro for healthcare guidance and text simplification
- **Mapping**: Google Maps API for geocoding and location services
- **Deployment**: Google Cloud (Cloud Run)

### Frontend
- **Framework**: Next.js 15.5.3 with React 19
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **UI Components**: Lucide React icons
- **Data Fetching**: Tanstack React Query
- **HTTP Client**: Axios
- **Deployment**: Vercel

### Key Dependencies
- Backend: `fastapi`, `uvicorn`, `pymongo`, `google-generativeai`, `googlemaps`
- Frontend: `react`, `next`, `@tanstack/react-query`, `axios`, `lucide-react`

## Architecture Overview

### Core Features
1. **Clinic Finder**: Location-based search for free/low-cost healthcare facilities
2. **AI Chat Assistant**: Gemini-powered guidance for healthcare questions
3. **Cost Transparency**: Clear pricing information for common medical services
4. **Resource Education**: Information about healthcare rights and assistance programs

### API Endpoints
- `GET /health` - Health check for all services
- `POST /search/clinics` - Search clinics by location and filters
- `POST /chat` - AI-powered healthcare guidance
- `POST /clinics` - Add new clinic to database
- `GET /clinics/{id}` - Get specific clinic details

### Database Schema (MongoDB)
```json
{
  "clinics": {
    "name": "string",
    "address": "string", 
    "phone": "string?",
    "services": ["array of strings"],
    "pricing_info": "string?",
    "languages": ["array of strings"],
    "hours": "string?",
    "walk_in_accepted": "boolean",
    "lgbtq_friendly": "boolean", 
    "immigrant_safe": "boolean",
    "website": "string?",
    "notes": "string?"
  }
}
```

## Development Commands

### Backend
```bash
cd backend
source venv/bin/activate  # IMPORTANT: Always activate virtual environment first
pip install -r requirements.txt
python main.py  # Runs on http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:3000
npm run build
npm run lint
```

## Environment Variables Required

### Backend (.env)
- `MONGODB_URI` - MongoDB Atlas connection string
- `GOOGLE_MAPS_API_KEY` - For geocoding and maps
- `GEMINI_API_KEY` - For AI chat functionality

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For frontend maps

## Target Users & Use Cases
- **Primary**: Uninsured individuals seeking affordable healthcare
- **Secondary**: Community health advocates, social workers
- **Use Cases**:
  - "I need a checkup but don't have insurance"
  - "Where can I get mental health services on a sliding scale?"
  - "Can I get emergency care if I can't pay?"
  - "What are my rights for receiving medical care?"

## Justice & Safety Considerations
- **Privacy-first**: Anonymous browsing, no required personal information
- **Accessibility**: Simple language, mobile-friendly design
- **Trust-building**: Clear disclaimers, source transparency
- **Bias prevention**: Inclusive filters (LGBTQ+ friendly, immigrant-safe)

## Hackathon Demo Flow
1. User enters ZIP code + health concern
2. System shows nearby free/low-cost clinics with filters
3. AI explains clinic options in plain language
4. User can ask questions about healthcare rights/options
5. Optional: Save favorite clinics with simple signup

## Current Status
- ✅ Project structure created
- ✅ Backend FastAPI app with core endpoints
- ✅ Frontend Next.js app with landing page
- ✅ Environment configuration templates
- ✅ MongoDB Atlas database setup completed
- ✅ Google Maps API configured (Places, Geocoding, Maps JavaScript APIs)
- ✅ Environment variables configured in backend/.env
- 🔄 Clinic data seeding system implementation
- 🔄 Weekly automated data refresh system
- 🔄 API integration between frontend/backend
- 🔄 Gemini API setup

## Data Seeding Strategy
**Geographic Focus**: Houston area only for HackRice 2025
**API Limit**: 30 healthcare facilities maximum to manage costs
**Search Terms**:
- "free clinic Houston"
- "community health center Houston"
- "federally qualified health center Houston"
- "urgent care Houston self pay"
- "sliding scale healthcare Houston"

**Pricing Strategy**:
- Prioritize clinics with published cash/sliding-scale prices
- Known Houston clinics with pricing: NeuMed, Texas MedClinic, AFC West University, Insight Urgent Care, FastMed, Texas Health Breeze
- Store exact pricing when available, mark as "Contact for pricing" when unavailable
- Weekly automated refresh via cron job to keep data current

## Next Development Steps
1. ✅ Set up MongoDB Atlas database
2. ✅ Configure Google Maps API keys
3. 🔄 Implement clinic data seeding from Google Places API
4. 🔄 Set up weekly automated data refresh system
5. Build clinic search interface and map display
6. Implement AI chat component
7. Add clinic detail pages and filtering
8. Deploy to production (Vercel + Google Cloud)

## File Structure
```
hackrice25/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── .env.example        # Environment template
├── frontend/
│   ├── src/app/
│   │   └── page.tsx        # Landing page
│   ├── package.json        # Node dependencies
│   └── .env.local.example  # Environment template
├── docs/                   # Documentation
├── CLAUDE.md              # This file
└── README.md              # Project readme
```

## Important Notes for Claude
- Always run `npm run lint` after frontend changes
- Backend uses MongoDB with proper error handling
- Frontend should be responsive and accessible
- Focus on simple, clear language for healthcare guidance
- Prioritize user privacy and safety in all implementations
- Test API endpoints with proper error responses
- Follow healthcare industry best practices for disclaimers
- The reason pip isn't working is because you need to have activated the virtual environment. please try it with this in mind and remember this in the claude.md file
- Don't put the comments of the directories at the top of the files
- don't use emojis in comments