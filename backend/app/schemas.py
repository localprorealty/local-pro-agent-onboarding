from pydantic import BaseModel, Field
from typing import List, Literal

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, description="Message text content")

class ChatRequest(BaseModel):
    messages: List[Message] = Field(..., description="Chronological history of messages in the conversation")

class ChatResponse(BaseModel):
    reply: str

class MLSLookupRequest(BaseModel):
    addressLine1: str
    city: str
    state: str
    zip: str

class ListingCopyRequest(BaseModel):
    propertyData: dict
    notes: str | None = None

class ListingCopyResponse(BaseModel):
    description: str
    socialCaption: str
