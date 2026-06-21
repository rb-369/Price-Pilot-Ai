from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from services.chatbot import chat_with_ai
from services.vector_store import ingest_data

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[Dict] = None

class IngestRequest(BaseModel):
    data: List[Dict[str, Any]]
    data_type: Optional[str] = "product"

@router.post("/chat")
async def handle_chat(request: ChatRequest):
    try:
        # Convert Pydantic models to dicts
        msgs_dict = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        reply = await chat_with_ai(msgs_dict, request.context)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest")
async def handle_ingest(request: IngestRequest):
    try:
        count = ingest_data(request.data, data_type=request.data_type)
        return {"message": f"Successfully ingested {count} documents into ChromaDB."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
