import os
import httpx
from typing import List, Dict, Any, Optional


# OpenRouter API configuration
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free"  # Free model


class OpenRouterClient:
    """
    Client for interacting with OpenRouter API.
    Supports reasoning-enabled models and conversation history.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self.model = os.getenv("OPENROUTER_MODEL", DEFAULT_MODEL)
        
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers for OpenRouter API."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("FRONTEND_URL", "http://localhost:3000"),
            "X-Title": "Trae AI Helpdesk"
        }
    
    async def chat_completion(
        self,
        messages: List[Dict[str, Any]],
        enable_reasoning: bool = False,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send a chat completion request to OpenRouter.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            enable_reasoning: Whether to enable reasoning mode
            model: Optional model override
            
        Returns:
            Response dict with 'content', 'reasoning_details' (if enabled), and 'model'
        """
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not configured")
        
        payload = {
            "model": model or self.model,
            "messages": messages
        }
        
        if enable_reasoning:
            payload["reasoning"] = {"enabled": True}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers=self._get_headers(),
                json=payload
            )
            response.raise_for_status()
            data = response.json()
        
        choice = data.get("choices", [{}])[0]
        message = choice.get("message", {})
        
        return {
            "content": message.get("content", ""),
            "reasoning_details": message.get("reasoning_details"),
            "model": data.get("model", self.model),
            "usage": data.get("usage", {})
        }
    
    async def generate_ticket_response(
        self,
        ticket_subject: str,
        ticket_description: str,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate an AI response for a support ticket.
        
        Args:
            ticket_subject: The ticket subject/title
            ticket_description: The ticket description/body
            conversation_history: Optional list of previous messages
            context: Optional additional context (e.g., from RAG search)
            
        Returns:
            Dict with 'response' (AI-generated text) and metadata
        """
        system_prompt = """You are a helpful customer support assistant for Trae AI Helpdesk. 
Your role is to assist customers with their inquiries professionally and empathetically.

Guidelines:
- Be concise but thorough in your responses
- Show empathy when customers express frustration
- Provide clear, actionable solutions
- If you don't have enough information, ask clarifying questions
- Never make promises you can't keep
- If the issue requires escalation, acknowledge that and explain next steps"""

        if context:
            system_prompt += f"\n\nRelevant context from knowledge base:\n{context}"
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", ""),
                    # Preserve reasoning_details if present
                    **({"reasoning_details": msg["reasoning_details"]} 
                       if msg.get("reasoning_details") else {})
                })
        else:
            # Initial ticket message
            user_message = f"Subject: {ticket_subject}\n\n{ticket_description}"
            messages.append({"role": "user", "content": user_message})
        
        result = await self.chat_completion(messages, enable_reasoning=True)
        
        return {
            "response": result["content"],
            "reasoning_details": result.get("reasoning_details"),
            "model": result["model"]
        }
    
    async def analyze_ticket(self, subject: str, description: str) -> Dict[str, Any]:
        """
        Analyze a ticket and suggest priority, category, and tags.
        
        Returns:
            Dict with 'priority', 'category', 'tags', and 'summary'
        """
        messages = [
            {
                "role": "system",
                "content": """You are a ticket analysis assistant. Analyze the support ticket and provide:
1. Priority: critical, high, medium, or low
2. Category: billing, technical, account, shipping, or general
3. Tags: comma-separated list of relevant tags (max 5)
4. Summary: one-line summary of the issue (max 100 chars)

Respond in JSON format only:
{"priority": "...", "category": "...", "tags": "...", "summary": "..."}"""
            },
            {
                "role": "user",
                "content": f"Subject: {subject}\n\nDescription: {description}"
            }
        ]
        
        result = await self.chat_completion(messages, enable_reasoning=False)
        
        try:
            import json
            analysis = json.loads(result["content"])
            return analysis
        except (json.JSONDecodeError, KeyError):
            # Fallback to basic analysis
            return {
                "priority": "medium",
                "category": "general",
                "tags": "support",
                "summary": subject[:100] if subject else "Support request"
            }


# Global client instance
_openrouter_client: Optional[OpenRouterClient] = None


def get_openrouter_client() -> OpenRouterClient:
    """Get or create the global OpenRouter client instance."""
    global _openrouter_client
    if _openrouter_client is None:
        _openrouter_client = OpenRouterClient()
    return _openrouter_client
