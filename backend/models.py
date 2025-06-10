from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class MessageRequest(BaseModel):
    """Request model for creating a message"""
    message: str = Field(..., description="The user's message", min_length=1)
    id: Optional[str] = Field(None, description="Optional conversation ID for continuing existing chat")

class MessageResponse(BaseModel):
    """Response model for message creation"""
    openai_id: str = Field(..., description="OpenAI response ID")
    message: str = Field(..., description="The chatbot's response message")

class LinkedInProfileRequest(BaseModel):
    """Request model for LinkedIn profile scraping"""
    linkedinUrl: str = Field(..., description="LinkedIn profile URL to scrape")

class LinkedInProfileResponse(BaseModel):
    """Response model for LinkedIn profile data"""
    firstName: str = Field(..., description="First name from LinkedIn profile")
    lastName: str = Field(..., description="Last name from LinkedIn profile")

class ChatMessage(BaseModel):
    """Model for individual chat messages"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique message ID")
    role: str = Field(..., description="Message role: user or assistant")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")
    openai_id: Optional[str] = Field(None, description="OpenAI response ID if applicable")

class ConversationSummary(BaseModel):
    """Model for conversation summary in list view"""
    id: str = Field(..., description="Conversation ID")
    last_message: str = Field(..., description="Last message content (truncated)")
    last_message_timestamp: datetime = Field(..., description="Timestamp of last message")
    message_count: int = Field(..., description="Total number of messages in conversation")
    last_role: str = Field(..., description="Role of the last message (user or assistant)")

class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(1, ge=1, description="Page number, minimum 1")
    limit: int = Field(10, ge=1, le=100, description="Number of items per page, 1-100")

class ChatHistoryResponse(BaseModel):
    """Response model for chat history with pagination"""
    messages: List[ChatMessage]
    total_messages: int
    page: int
    limit: int
    total_pages: int
    has_next: bool
    has_previous: bool

class ConversationListResponse(BaseModel):
    """Response model for conversation list with pagination"""
    conversations: List[ConversationSummary]
    total_conversations: int
    page: int
    limit: int
    total_pages: int
    has_next: bool
    has_previous: bool

class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str
    openai_client: str
    api_key_configured: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ErrorResponse(BaseModel):
    """Error response model"""
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow) 