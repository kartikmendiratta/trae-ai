from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
from supabase import create_client
from services.ai import analyze_sentiment, extract_tags

router = APIRouter()

# Supabase client - use service key to bypass RLS for backend operations
supabase_url = os.getenv("SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")
supabase = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None


class TicketCreate(BaseModel):
    customer_id: str
    subject: str
    description: str
    priority: Optional[str] = "medium"


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None


@router.get("/")
async def get_tickets(
    status: Optional[str] = None, 
    customer_id: Optional[str] = None,
    limit: int = 50
):
    """Get all tickets, optionally filtered by status and customer_id"""
    try:
        query = supabase.table("tickets").select("*, profiles(email, full_name)")
        
        if status:
            query = query.eq("status", status)
            
        if customer_id:
            query = query.eq("customer_id", customer_id)
            
        result = query.order("created_at", desc=True).limit(limit).execute()
        return {"tickets": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticket_id}")
async def get_ticket(ticket_id: int):
    """Get a single ticket by ID"""
    try:
        result = supabase.table("tickets").select("*, profiles(email, full_name)").eq("id", ticket_id).single().execute()
        return {"ticket": result.data}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Ticket not found")


@router.post("/")
async def create_ticket(ticket: TicketCreate):
    """Create a new ticket with AI sentiment analysis and tagging"""
    try:
        # Analyze sentiment and extract tags
        sentiment_score = analyze_sentiment(ticket.description)
        tags = extract_tags(ticket.subject + " " + ticket.description)
        
        result = supabase.table("tickets").insert({
            "customer_id": ticket.customer_id,
            "subject": ticket.subject,
            "description": ticket.description,
            "priority": ticket.priority,
            "sentiment_score": sentiment_score,
            "tags": tags,
            "status": "open"
        }).execute()
        
        return {"ticket": result.data[0], "message": "Ticket created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{ticket_id}")
async def update_ticket(ticket_id: int, ticket: TicketUpdate):
    """Update ticket status or priority"""
    try:
        update_data = {k: v for k, v in ticket.model_dump().items() if v is not None}
        result = supabase.table("tickets").update(update_data).eq("id", ticket_id).execute()
        return {"ticket": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
