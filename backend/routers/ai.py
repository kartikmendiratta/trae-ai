from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from services.openrouter import get_openrouter_client
from services.rag import search_similar_messages

router = APIRouter(prefix="/ai", tags=["AI"])


class ChatMessage(BaseModel):
    role: str
    content: str
    reasoning_details: Optional[Any] = None


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    enable_reasoning: bool = True
    use_rag: bool = True  # Whether to include RAG context


class ChatResponse(BaseModel):
    content: str
    reasoning_details: Optional[Any] = None
    model: str


class TicketAnalysisRequest(BaseModel):
    subject: str
    description: str


class TicketAnalysisResponse(BaseModel):
    priority: str
    category: str
    tags: str
    summary: str


class GenerateResponseRequest(BaseModel):
    ticket_subject: str
    ticket_description: str
    conversation_history: Optional[List[Dict[str, Any]]] = None


class GenerateResponseResult(BaseModel):
    response: str
    reasoning_details: Optional[Any] = None
    model: str


@router.post("/chat", response_model=ChatResponse)
async def chat_completion(request: ChatRequest):
    """
    Send a chat message and get an AI response.
    Supports conversation history and reasoning mode.
    """
    try:
        client = get_openrouter_client()
        
        # Get RAG context if enabled and there's a user message
        context = None
        if request.use_rag and request.messages:
            last_user_msg = next(
                (m for m in reversed(request.messages) if m.role == "user"),
                None
            )
            if last_user_msg:
                similar = search_similar_messages(last_user_msg.content, match_count=3)
                if similar:
                    context = "\n".join([
                        f"- {msg.get('content', '')[:200]}" 
                        for msg in similar
                    ])
        
        # Convert messages to dict format, preserving reasoning_details
        messages = []
        for msg in request.messages:
            msg_dict = {"role": msg.role, "content": msg.content}
            if msg.reasoning_details:
                msg_dict["reasoning_details"] = msg.reasoning_details
            messages.append(msg_dict)
        
        # Add RAG context as system message if available
        if context:
            messages.insert(0, {
                "role": "system",
                "content": f"Relevant context from knowledge base:\n{context}"
            })
        
        result = await client.chat_completion(
            messages=messages,
            enable_reasoning=request.enable_reasoning
        )
        
        return ChatResponse(
            content=result["content"],
            reasoning_details=result.get("reasoning_details"),
            model=result["model"]
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/analyze-ticket", response_model=TicketAnalysisResponse)
async def analyze_ticket(request: TicketAnalysisRequest):
    """
    Analyze a ticket and suggest priority, category, and tags.
    """
    try:
        client = get_openrouter_client()
        result = await client.analyze_ticket(request.subject, request.description)
        
        return TicketAnalysisResponse(
            priority=result.get("priority", "medium"),
            category=result.get("category", "general"),
            tags=result.get("tags", "support"),
            summary=result.get("summary", request.subject[:100])
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/generate-response", response_model=GenerateResponseResult)
async def generate_ticket_response(request: GenerateResponseRequest):
    """
    Generate an AI response for a support ticket.
    Uses RAG to include relevant context from previous messages.
    """
    try:
        client = get_openrouter_client()
        
        # Get RAG context
        context = None
        search_query = f"{request.ticket_subject} {request.ticket_description[:200]}"
        similar = search_similar_messages(search_query, match_count=3)
        if similar:
            context = "\n".join([
                f"- {msg.get('content', '')[:200]}" 
                for msg in similar
            ])
        
        result = await client.generate_ticket_response(
            ticket_subject=request.ticket_subject,
            ticket_description=request.ticket_description,
            conversation_history=request.conversation_history,
            context=context
        )
        
        return GenerateResponseResult(
            response=result["response"],
            reasoning_details=result.get("reasoning_details"),
            model=result["model"]
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
