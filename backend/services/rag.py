import os
from openai import OpenAI
from supabase import create_client
from typing import List, Optional

# Initialize clients
openai_client = None
supabase_client = None


def get_openai_client():
    global openai_client
    if openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            openai_client = OpenAI(api_key=api_key)
    return openai_client


def get_supabase_client():
    global supabase_client
    if supabase_client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_ANON_KEY", "")
        if url and key:
            supabase_client = create_client(url, key)
    return supabase_client


def get_embedding(text: str) -> Optional[List[float]]:
    """
    Generate embedding for text using OpenAI's text-embedding-3-small model.
    Returns a 1536-dimensional vector.
    """
    try:
        client = get_openai_client()
        if not client:
            return None
            
        response = client.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Embedding error: {e}")
        return None


def search_similar_messages(query: str, match_count: int = 5, match_threshold: float = 0.7):
    """
    Search for similar messages using vector similarity.
    Uses Supabase's match_messages RPC function.
    """
    try:
        query_embedding = get_embedding(query)
        if not query_embedding:
            return []
            
        supabase = get_supabase_client()
        if not supabase:
            return []
            
        result = supabase.rpc("match_messages", {
            "query_embedding": query_embedding,
            "match_threshold": match_threshold,
            "match_count": match_count
        }).execute()
        
        return result.data if result.data else []
    except Exception as e:
        print(f"Search error: {e}")
        return []
