# LocalPRO Onboarding Backend

A lightweight standalone FastAPI backend for the LocalPRO agent onboarding site. 

This service handles the onboarding assistant chat endpoint (`POST /chat`) powered by Groq (Llama 3.3 70B) using a system prompt isolated in `app/prompts.py`. Form submissions are routed directly from the frontend to a Google Sheets Apps Script web app, keeping this backend stateless and simple.

## Setup Instructions

### 1. Prerequisites
- Python 3.10 or higher
- A Groq API Key

### 2. Install Dependencies
Navigate to the `backend` folder and set up a virtual environment:
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install required packages
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy the template environment file and fill in your Groq API Key:
```bash
cp .env.example .env
```
Open `.env` and specify:
- `GROQ_API_KEY`: Your real Groq API key (starts with `gsk_`).
- `CORS_ORIGINS`: Allowed origins (e.g. `http://localhost:5173`).

### 4. Run the Dev Server
Launch FastAPI using Uvicorn:
```bash
uvicorn app.main:app --reload
```
The server will start on [http://localhost:8000](http://localhost:8000).

## API Endpoints

### `GET /health`
A simple check to ensure the server is running correctly.

### `POST /chat`
Accepts a conversation history and responds in the character of **North**, the LocalPRO onboarding guide.

**Payload:**
```json
{
  "messages": [
    { "role": "user", "content": "Tell me about the HEART culture." }
  ]
}
```

**Response:**
```json
{
  "reply": "At LocalPRO, our culture is built on the H.E.A.R.T. framework..."
}
```

---

## Known Gaps (Auth / Rate Limiting)
As per current project scope, there is no built-in auth, API keys, or rate-limiting for the `/chat` endpoint. These are flagged as known security gaps to be addressed in future development cycles if this API is exposed to untrusted public traffic.
