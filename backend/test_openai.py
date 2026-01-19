from dotenv import load_dotenv
from services.rag import get_embedding
import os


def main():
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        load_dotenv(".env.example")
        api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        print("OPENAI_API_KEY is not set in .env or .env.example.")
        return

    print("OPENAI_API_KEY is set. Testing OpenAI embedding API...")
    embedding = get_embedding("Hello from the AI Smart Helpdesk test.")

    if embedding:
        print(f"Success: OpenAI API responded. Embedding length: {len(embedding)}")
    else:
        print(
            "Failed: Could not generate embedding. "
            "The API key might be invalid, network may be blocked, "
            "or the OpenAI service returned an error."
        )


if __name__ == "__main__":
    main()
