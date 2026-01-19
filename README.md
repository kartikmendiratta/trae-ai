# AI Smart Helpdesk MVP

A fully functional AI-powered helpdesk system built with the "Trinity Stack":
- **Frontend**: Next.js (App Router) + Tailwind CSS + Shadcn UI
- **Backend**: Python FastAPI
- **Database**: Supabase (PostgreSQL + pgvector)

## Features

- ✅ Real-time chat interface
- ✅ AI Sentiment Analysis (TextBlob)
- ✅ Smart Tag Extraction
- ✅ RAG-powered message search (OpenAI embeddings)
- ✅ Monochromatic zinc design theme

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Supabase account

### 1. Set up Supabase

Run the SQL schema from `task.md` in your Supabase SQL Editor.

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
uvicorn main:app --reload
```

## Project Structure

```
trae-ai/
├── frontend/                # Next.js App
│   ├── src/
│   │   ├── app/            # Pages (App Router)
│   │   ├── components/     # React components
│   │   └── lib/            # Utilities
│   └── package.json
├── backend/                 # FastAPI Service
│   ├── routers/            # API routes
│   ├── services/           # AI & RAG logic
│   ├── main.py             # Entry point
│   └── requirements.txt
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets` | List all tickets |
| POST | `/api/tickets` | Create ticket with AI analysis |
| GET | `/api/tickets/{id}` | Get ticket details |
| PATCH | `/api/tickets/{id}` | Update ticket status |
| GET | `/api/messages/{ticket_id}` | Get ticket messages |
| POST | `/api/messages` | Send message |
| POST | `/api/messages/search` | RAG search |
