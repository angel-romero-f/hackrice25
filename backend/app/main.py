from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import clinics, chat, chatbot
from app.config import MONGODB_URI, GOOGLE_MAPS_API_KEY, GEMINI_API_KEY

app = FastAPI(
    title="Care Compass API",
    description="Healthcare access platform for uninsured individuals",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(clinics.router)
app.include_router(chat.router)
app.include_router(chatbot.router)

@app.get("/")
async def root():
    return {"message": "Care Compass API - Connecting you to affordable healthcare"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": {
        "mongodb": "configured" if MONGODB_URI else "not configured",
        "google_maps": "configured" if GOOGLE_MAPS_API_KEY else "not configured",
        "gemini": "configured" if GEMINI_API_KEY else "not configured"
    }}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)