from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime
import uuid

from config import settings
from models import (
    MessageRequest, MessageResponse, HealthResponse, ErrorResponse,
    ChatMessage, ChatHistoryResponse, PaginationParams, ConversationListResponse,
    LinkedInProfileRequest, LinkedInProfileResponse, CompleteUserProfileResponse
)
from services import conversation_service, chat_storage, linkedin_service, user_storage

# Configure logging
logging.basicConfig(level=getattr(logging, settings.log_level))
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Chatbot Backend API",
    description="A FastAPI backend for chatbot application with OpenAI integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Chatbot Backend API is running"}

@app.post("/messages", response_model=MessageResponse, responses={500: {"model": ErrorResponse}})
async def create_message(request: MessageRequest):
    """
    Create a new message or continue existing conversation
    
    Args:
        request: MessageRequest containing message and optional id
        
    Returns:
        MessageResponse with OpenAI response id and message content
    """
    try:
        # Generate conversation ID if not provided
        conversation_id = request.id or str(uuid.uuid4())
        
        logger.info(f"Processing message request. Conversation ID: {conversation_id}")
        
        # Save user message to storage
        user_message = ChatMessage(
            role="user",
            content=request.message,
            openai_id=None
        )
        chat_storage.save_message(conversation_id, user_message)
        
        # Call conversation service
        result = await conversation_service.create_response(
            message=request.message,
            conversation_id=conversation_id
        )
        
        # Save assistant response to storage
        assistant_message = ChatMessage(
            role="assistant",
            content=result["message"],
            openai_id=result["response_id"]
        )
        chat_storage.save_message(conversation_id, assistant_message)
        
        response = MessageResponse(
            id=conversation_id,
            openai_id=result["response_id"],
            message=result["message"]
        )
        
        logger.info(f"Message processed successfully. Response ID: {response.openai_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process message: {str(e)}"
        )

@app.post("/linkedin-profile", response_model=LinkedInProfileResponse, responses={500: {"model": ErrorResponse}})
async def scrape_linkedin_profile(request: LinkedInProfileRequest):
    """
    Scrape LinkedIn profile to extract firstName and lastName
    
    Args:
        request: LinkedInProfileRequest containing linkedinUrl
        
    Returns:
        LinkedInProfileResponse with firstName and lastName
    """
    try:
        logger.info(f"Processing LinkedIn profile scraping request for: {request.linkedinUrl}")
        
        # Call LinkedIn service to scrape profile (now returns Dict with all data)
        profile_data = await linkedin_service.scrape_profile(request.linkedinUrl)
        
        # Save all profile data to user.json
        user_storage.save_profile(request.linkedinUrl, profile_data)
        
        # Extract firstName and lastName for the response
        first_name = profile_data.get("firstName", "")
        last_name = profile_data.get("lastName", "")
        
        # Create response object for API compatibility
        response = LinkedInProfileResponse(
            firstName=first_name,
            lastName=last_name
        )
        
        logger.info(f"LinkedIn profile scraped and saved successfully: {first_name} {last_name}")
        logger.info(f"Total profile fields saved: {len(profile_data)}")
        
        return response
        
    except Exception as e:
        logger.error(f"Error scraping LinkedIn profile: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to scrape LinkedIn profile: {str(e)}"
        )

@app.get("/chat", response_model=ConversationListResponse, responses={500: {"model": ErrorResponse}})
async def get_all_conversations(
    page: int = Query(1, ge=1, description="Page number, minimum 1"),
    limit: int = Query(10, ge=1, le=100, description="Number of conversations per page, 1-100")
):
    """
    Get all conversations with pagination, ordered from latest to oldest
    
    Args:
        page: Page number (default: 1, minimum: 1)
        limit: Conversations per page (default: 10, minimum: 1, maximum: 100)
        
    Returns:
        ConversationListResponse with paginated conversations and metadata
    """
    try:
        logger.info(f"Retrieving all conversations - page: {page}, limit: {limit}")
        
        pagination = PaginationParams(page=page, limit=limit)
        
        # Get conversations from storage
        conversations_response = chat_storage.get_all_conversations(pagination)
        
        logger.info(f"Retrieved {len(conversations_response.conversations)} conversations")
        
        return conversations_response
        
    except Exception as e:
        logger.error(f"Error retrieving conversations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve conversations: {str(e)}"
        )

@app.get("/chat/{conversation_id}", response_model=ChatHistoryResponse, responses={500: {"model": ErrorResponse}})
async def get_chat_history(
    conversation_id: str,
    page: int = Query(1, ge=1, description="Page number, minimum 1"),
    limit: int = Query(10, ge=1, le=100, description="Number of messages per page, 1-100")
):
    """
    Get chat history for a specific conversation with pagination
    
    Args:
        conversation_id: The conversation ID
        page: Page number (default: 1, minimum: 1)
        limit: Messages per page (default: 10, minimum: 1, maximum: 100)
        
    Returns:
        ChatHistoryResponse with paginated messages and metadata
    """
    try:
        logger.info(f"Retrieving chat history for conversation: {conversation_id}")
        
        pagination = PaginationParams(page=page, limit=limit)
        
        # Get messages from storage
        chat_history = chat_storage.get_conversation_messages(conversation_id, pagination)
        
        logger.info(f"Retrieved {len(chat_history.messages)} messages for conversation {conversation_id}")
        
        return chat_history
        
    except Exception as e:
        logger.error(f"Error retrieving chat history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve chat history: {str(e)}"
        )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check endpoint"""
    return HealthResponse(
        status="healthy",
        openai_client="initialized" if conversation_service.is_initialized() else "not_initialized",
        api_key_configured=bool(settings.openai_api_key),
        timestamp=datetime.utcnow()
    )

@app.get("/user-profile", response_model=CompleteUserProfileResponse, responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def get_user_profile():
    """
    Get the complete user profile data
    
    Returns:
        CompleteUserProfileResponse with all saved user profile information
    """
    try:
        logger.info("Retrieving user profile data")
        
        # Get profile data from storage
        profile_data = user_storage.get_profile()
        
        if not profile_data:
            raise HTTPException(
                status_code=404,
                detail="No user profile found. Please scrape a LinkedIn profile first."
            )
        
        logger.info(f"Retrieved user profile with {len(profile_data)} fields")
        
        # Return all profile data
        return CompleteUserProfileResponse(**profile_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving user profile: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve user profile: {str(e)}"
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    error_response = ErrorResponse(
        detail=exc.detail,
        error_code=str(exc.status_code),
        timestamp=datetime.utcnow()
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(mode="json")
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host=settings.api_host, 
        port=settings.api_port, 
        reload=settings.api_reload
    ) 