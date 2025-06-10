import json
import os
import logging
from typing import Dict, List, Optional
from datetime import datetime
import math

from models import ChatMessage, ChatHistoryResponse, PaginationParams, ConversationSummary, ConversationListResponse

logger = logging.getLogger(__name__)

class ChatStorageService:
    """Service for managing chat storage in JSON file"""
    
    def __init__(self, storage_file: str = "chats.json"):
        """Initialize the chat storage service"""
        self.storage_file = storage_file
        self.storage_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), storage_file)
        self._ensure_storage_file()
    
    def _ensure_storage_file(self) -> None:
        """Ensure the storage file exists with proper structure"""
        if not os.path.exists(self.storage_path):
            initial_data = {"conversations": {}}
            try:
                with open(self.storage_path, 'w') as f:
                    json.dump(initial_data, f, indent=2)
                logger.info(f"Created new chat storage file: {self.storage_path}")
            except Exception as e:
                logger.error(f"Failed to create storage file: {e}")
                raise
    
    def _load_data(self) -> Dict:
        """Load data from storage file"""
        try:
            with open(self.storage_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load storage file: {e}")
            return {"conversations": {}}
    
    def _save_data(self, data: Dict) -> None:
        """Save data to storage file"""
        try:
            with open(self.storage_path, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            logger.debug("Chat data saved successfully")
        except Exception as e:
            logger.error(f"Failed to save storage file: {e}")
            raise
    
    def save_message(self, conversation_id: str, message: ChatMessage) -> None:
        """Save a message to the specified conversation"""
        try:
            data = self._load_data()
            
            if conversation_id not in data["conversations"]:
                data["conversations"][conversation_id] = {"messages": []}
            
            # Convert message to dict for JSON storage
            message_dict = message.model_dump()
            message_dict["timestamp"] = message.timestamp.isoformat()
            
            data["conversations"][conversation_id]["messages"].append(message_dict)
            self._save_data(data)
            
            logger.info(f"Message saved to conversation {conversation_id}")
            
        except Exception as e:
            logger.error(f"Failed to save message: {e}")
            raise
    
    def get_conversation_messages(
        self, 
        conversation_id: str, 
        pagination: PaginationParams
    ) -> ChatHistoryResponse:
        """Get messages from a conversation with pagination"""
        try:
            data = self._load_data()
            
            if conversation_id not in data["conversations"]:
                # Return empty response for non-existent conversation
                return ChatHistoryResponse(
                    messages=[],
                    total_messages=0,
                    page=pagination.page,
                    limit=pagination.limit,
                    total_pages=0,
                    has_next=False,
                    has_previous=False
                )
            
            messages_data = data["conversations"][conversation_id]["messages"]
            total_messages = len(messages_data)
            
            # Calculate pagination
            total_pages = math.ceil(total_messages / pagination.limit) if total_messages > 0 else 0
            start_index = (pagination.page - 1) * pagination.limit
            end_index = start_index + pagination.limit
            
            # Get paginated messages
            paginated_messages_data = messages_data[start_index:end_index]
            
            # Convert to ChatMessage objects
            messages = []
            for msg_data in paginated_messages_data:
                # Parse timestamp back to datetime
                msg_data_copy = msg_data.copy()
                if isinstance(msg_data_copy["timestamp"], str):
                    msg_data_copy["timestamp"] = datetime.fromisoformat(msg_data_copy["timestamp"])
                
                messages.append(ChatMessage(**msg_data_copy))
            
            return ChatHistoryResponse(
                messages=messages,
                total_messages=total_messages,
                page=pagination.page,
                limit=pagination.limit,
                total_pages=total_pages,
                has_next=pagination.page < total_pages,
                has_previous=pagination.page > 1
            )
            
        except Exception as e:
            logger.error(f"Failed to get conversation messages: {e}")
            raise
    
    def get_all_conversations(self, pagination: PaginationParams) -> ConversationListResponse:
        """Get all conversations with pagination, sorted by latest message timestamp"""
        try:
            data = self._load_data()
            conversations_data = data.get("conversations", {})
            
            if not conversations_data:
                # Return empty response if no conversations exist
                return ConversationListResponse(
                    conversations=[],
                    total_conversations=0,
                    page=pagination.page,
                    limit=pagination.limit,
                    total_pages=0,
                    has_next=False,
                    has_previous=False
                )
            
            # Create conversation summaries with last message info
            conversation_summaries = []
            for conv_id, conv_data in conversations_data.items():
                messages = conv_data.get("messages", [])
                if not messages:
                    continue  # Skip empty conversations
                
                # Get last message
                last_message = messages[-1]
                last_timestamp = datetime.fromisoformat(last_message["timestamp"])
                
                # Truncate last message content for summary (max 100 chars)
                last_content = last_message["content"]
                if len(last_content) > 100:
                    last_content = last_content[:97] + "..."
                
                conversation_summary = ConversationSummary(
                    id=conv_id,
                    last_message=last_content,
                    last_message_timestamp=last_timestamp,
                    message_count=len(messages),
                    last_role=last_message["role"]
                )
                conversation_summaries.append(conversation_summary)
            
            # Sort by last message timestamp (newest first)
            conversation_summaries.sort(key=lambda x: x.last_message_timestamp, reverse=True)
            
            total_conversations = len(conversation_summaries)
            
            # Apply pagination
            total_pages = math.ceil(total_conversations / pagination.limit) if total_conversations > 0 else 0
            start_index = (pagination.page - 1) * pagination.limit
            end_index = start_index + pagination.limit
            
            paginated_conversations = conversation_summaries[start_index:end_index]
            
            return ConversationListResponse(
                conversations=paginated_conversations,
                total_conversations=total_conversations,
                page=pagination.page,
                limit=pagination.limit,
                total_pages=total_pages,
                has_next=pagination.page < total_pages,
                has_previous=pagination.page > 1
            )
            
        except Exception as e:
            logger.error(f"Failed to get all conversations: {e}")
            raise
    
    def conversation_exists(self, conversation_id: str) -> bool:
        """Check if a conversation exists"""
        try:
            data = self._load_data()
            return conversation_id in data["conversations"]
        except Exception as e:
            logger.error(f"Failed to check conversation existence: {e}")
            return False

# Global storage service instance
chat_storage = ChatStorageService() 