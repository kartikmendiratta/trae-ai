from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from supabase import create_client
from services.rag import get_embedding, search_similar_messages

router = APIRouter()

# Supabase client - use service key to bypass RLS for backend operations
supabase_url = os.getenv("SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")
supabase = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None


class MessageCreate(BaseModel):
    ticket_id: int
    sender_id: str
    content: str
    is_internal: Optional[bool] = False


class RAGQuery(BaseModel):
    query: str
    match_count: Optional[int] = 5


@router.get("/{ticket_id}")
async def get_messages(ticket_id: int):
    """Get all messages for a ticket"""
    try:
        result = supabase.table("messages").select("*, profiles(email, full_name)").eq("ticket_id", ticket_id).order("created_at").execute()
        return {"messages": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_message(message: MessageCreate):
    """Create a new message with optional embedding for RAG"""
    try:
        # Generate embedding for RAG (optional - can be disabled for performance)
        embedding = None
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            embedding = get_embedding(message.content)
        
        insert_data = {
            "ticket_id": message.ticket_id,
            "sender_id": message.sender_id,
            "content": message.content,
            "is_internal": message.is_internal
        }
        
        if embedding:
            insert_data["embedding"] = embedding
            
        result = supabase.table("messages").insert(insert_data).execute()
        return {"message": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search_messages(query: RAGQuery):
    """Search messages using RAG (vector similarity)"""
    try:
        results = search_similar_messages(query.query, query.match_count)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
