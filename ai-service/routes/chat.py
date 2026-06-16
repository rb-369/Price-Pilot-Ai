from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from services.chatbot import chat_with_ai

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[Dict] = None

@router.post("/chat")
async def handle_chat(request: ChatRequest):
    try:
        # Convert Pydantic models to dicts
        msgs_dict = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        reply = await chat_with_ai(msgs_dict, request.context)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
