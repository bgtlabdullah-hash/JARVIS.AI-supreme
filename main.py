import os
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI(title="JARVIS AI Supreme Backend", version="9.6.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

default_client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))

class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    tool: str = "chat"
    system_prompt: str = ""

@app.get("/api/health")
def health_check():
    return {"status": "online", "version": "9.6.0"}

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest, x_groq_key: str | None = Header(default=None)):
    try:
        active_client = default_client
        if x_groq_key and x_groq_key.startswith("gsk_"):
            active_client = Groq(api_key=x_groq_key)

        if not active_client.api_key:
            raise HTTPException(status_code=400, detail="Groq API key is missing. Please configure it in the UI settings.")

        completion = active_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": req.system_prompt or "You are JARVIS AI Supreme, an elite personal assistant."},
                {"role": "user", "content": req.message}
            ],
            temperature=0.7
        )
        
        return {
            "answer": completion.choices[0].message.content,
            "conversation_id": req.conversation_id or "session-alpha",
            "sources": [],
            "web_search_used": False
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
