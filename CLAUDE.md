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
- **Mapping**: Google Maps API for geocoding, location services, and Maps JavaScript API for interactive maps
- **Deployment**: Google Cloud (Cloud Run)

### Frontend
- **Framework**: Next.js 15.5.3 with React 19 (App Router)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **UI Components**: Lucide React icons
- **Data Fetching**: Tanstack React Query
- **HTTP Client**: Axios
- **Deployment**: Vercel
- **Routing**: File-based routing with App Router
  - `/` - Landing page (homepage with search form)
  - `/search` - Search results page (clinic listings with filters)

### Key Dependencies
- Backend: `fastapi`, `uvicorn`, `pymongo`, `google-generativeai`, `googlemaps`, `google-cloud-storage`
- Frontend: `react`, `next`, `@tanstack/react-query`, `axios`, `lucide-react`

## Architecture Overview

### Core Features
1. **Clinic Finder**: Location-based search for free/low-cost healthcare facilities
2. **AI Chat Assistant**: Gemini-powered guidance for healthcare questions
3. **Cost Transparency**: Clear pricing information for common medical services
4. **Resource Education**: Information about healthcare rights and assistance programs

### API Endpoints
- `GET /health` - Health check for all services
- `GET /clinics` - Get all clinics (simple array response)
- `POST /clinics/search` - Search clinics by location and filters (preferred for frontend forms)
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

# For refactored structure (recommended for team development):
python -m app.main  # Runs on http://localhost:8000

# For legacy single file:
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
- `GOOGLE_CLOUD_PROJECT` - Google Cloud project ID for storage
- `GOOGLE_CLOUD_STORAGE_BUCKET` - Storage bucket name (default: care-compass-photos)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For Maps JavaScript API and frontend maps integration

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
- ✅ Clinic data seeding system implementation (seeder.py completed)
- ✅ Geospatial search with MongoDB working correctly
- ✅ Refactored code into organized folder structure for team development
- ✅ Next.js App Router implementation with search functionality
- ✅ Search results page with ZocDoc-style layout and filtering
- ✅ Interactive Google Maps integration with clinic markers
- ✅ Real-time marker filtering based on user-selected criteria
- ✅ Clinic location visualization with click-to-scroll functionality
- ✅ Google Maps Photos integration with Cloud Storage caching
- ✅ Interactive photo galleries in clinic search results
- ✅ Responsive clinic cards with visual previews
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
│   ├── app/                 # Organized backend structure (recommended)
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI app setup
│   │   ├── config.py       # Environment variables
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── clinic.py   # Pydantic models
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── clinics.py  # Clinic endpoints
│   │   │   └── chat.py     # AI chat endpoints
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── database.py # MongoDB connection
│   │       ├── maps.py     # Google Maps service
│   │       └── ai.py       # Gemini AI service
│   ├── main.py             # Legacy single file (still works)
│   ├── seeder.py           # Data seeding script
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
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
- Don't use emojis in comments
- Don't use emojis in logs or console output

## MongoDB Query Fixes Applied
- **Database Name**: Fixed mismatch between seeder.py (`carecompass`) and main.py (`care_compass`) - now both use `carecompass`
- **Geospatial Search**: Implemented proper MongoDB geospatial queries using `$geoNear` aggregation pipeline
- **Distance Calculation**: Added distance_meters field to search results showing actual distance from search location
- **Environment File**: Renamed `.local.env` to `.env` so dotenv can find it properly
- **Data Structure**: Clinic data includes GeoJSON Point coordinates for proper geospatial indexing
- **Radius Filtering**: Properly converts miles to meters and filters results within specified radius
- **Search Endpoint**: Use POST `/clinics/search` instead of GET with query params for better frontend integration

## Maps JavaScript API Implementation

### Interactive Map Features
- **Real-time clinic visualization**: Shows all filtered clinics as markers on an interactive map
- **Custom markers**: Color-coded markers (green for walk-ins accepted, red for appointment needed)
- **Info windows**: Rich popups with clinic details, services, pricing, and action buttons
- **User location**: Blue marker showing user's current/searched location
- **Auto-fitting bounds**: Automatically adjusts zoom and position to show all relevant clinics
- **Click-to-scroll integration**: Clicking map markers scrolls to corresponding clinic in results list

### Map Layout Options
- **Side-by-side view**: On large screens (lg+), map and clinic list display side-by-side
- **Sticky positioning**: Map stays in view while scrolling through clinic results
- **Responsive toggling**: Mobile devices show map/list toggle, desktop shows "Map & List"/"List Only" toggle
- **Smart defaults**: Map visible by default for better user experience

### Map Component Structure
```typescript
// Key GoogleMap component props
interface GoogleMapProps {
  clinics: Clinic[];                    // Array of filtered clinics to display
  userLocation?: { lat: number; lng: number };  // User's location
  onMarkerClick?: (clinic: Clinic) => void;     // Callback for marker interactions
  height?: string;                      // Customizable map height
  className?: string;                   // Additional styling
}
```

### Maps API Configuration
- **Required APIs**: Maps JavaScript API, Places API (for geocoding)
- **Script loading**: Dynamic script injection with promise-based loading
- **Error handling**: Graceful fallback when Maps API fails to load
- **Performance**: Efficient marker management with cleanup on component unmount
- Remember to alwasys test http requests with HTTPie, not curl.

## Photo Integration Implementation Notes
- **Google Cloud Storage**: Photos are cached in `care-compass-photos` bucket with public read access
- **Photo Processing**: Limited to 3 photos per clinic during seeding to manage API costs
- **Authentication**: Uses Application Default Credentials for local development (`gcloud auth application-default login`)
- **Legacy Places API**: Required to be enabled in Google Cloud Console for photo access
- **Database Indexes**: MongoDB creates geospatial, text search, and filter indexes for performance
- **Error Handling**: Photo failures don't block clinic seeding - clinics added with empty image_urls arrays
- **Cloud Run Ready**: Service account permissions configured for production deployment
- **API Integration**: All existing endpoints now return `image_urls` field in clinic responses
