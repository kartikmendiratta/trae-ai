from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="AI Smart Helpdesk API",
    description="Backend API for the AI-powered helpdesk system",
    version="1.0.0"
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", os.getenv("FRONTEND_URL", "")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AI Smart Helpdesk API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Import routers after app creation to avoid circular imports
from routers import tickets, messages, ai

app.include_router(tickets.router, prefix="/api/tickets", tags=["tickets"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
app.include_router(ai.router, prefix="/api", tags=["ai"])
