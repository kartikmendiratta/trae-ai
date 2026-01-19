from textblob import TextBlob
import re


def analyze_sentiment(text: str) -> float:
    """
    Analyze sentiment of text using TextBlob.
    Returns a score from -1.0 (negative) to 1.0 (positive).
    """
    try:
        blob = TextBlob(text)
        return round(blob.sentiment.polarity, 2)
    except Exception:
        return 0.0


def extract_tags(text: str) -> str:
    """
    Extract keywords/tags from text using simple keyword matching.
    Returns comma-separated tags.
    """
    # Common helpdesk categories
    categories = {
        "billing": ["billing", "payment", "invoice", "charge", "refund", "subscription", "price"],
        "technical": ["error", "bug", "crash", "not working", "broken", "issue", "problem", "failed"],
        "account": ["account", "login", "password", "access", "authentication", "sign in", "register"],
        "shipping": ["shipping", "delivery", "order", "tracking", "shipment", "arrive"],
        "general": ["question", "help", "support", "inquiry", "information"]
    }
    
    text_lower = text.lower()
    found_tags = []
    
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in text_lower:
                if category not in found_tags:
                    found_tags.append(category)
                break
    
    return ",".join(found_tags) if found_tags else "general"


def get_priority_from_sentiment(sentiment_score: float) -> str:
    """
    Suggest priority based on sentiment score.
    Very negative sentiment = higher priority.
    """
    if sentiment_score < -0.5:
        return "critical"
    elif sentiment_score < -0.2:
        return "high"
    elif sentiment_score < 0.2:
        return "medium"
    else:
        return "low"
