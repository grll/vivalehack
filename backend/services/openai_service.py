import logging
from typing import Optional, Dict, Any
from openai import OpenAI
from config import settings

logger = logging.getLogger(__name__)


class OpenAIService:
    """Service class for OpenAI API interactions"""

    def __init__(self):
        """Initialize the OpenAI service"""
        self.client = None
        self._initialize_client()

    def _initialize_client(self) -> None:
        """Initialize OpenAI client with API key"""
        try:
            if settings.openai_api_key:
                self.client = OpenAI(api_key=settings.openai_api_key)
                logger.info("OpenAI client initialized successfully")
            else:
                logger.warning("OpenAI API key not found")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            self.client = None

    def is_initialized(self) -> bool:
        """Check if OpenAI client is properly initialized"""
        return self.client is not None

    async def create_responses(
        self, message: str, conversation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a response using OpenAI responses API

        Args:
            message: User's message
            conversation_id: Optional conversation ID for continuing existing chat

        Returns:
            Dict containing response_id and message content

        Raises:
            Exception: If OpenAI client is not initialized or API call fails
        """
        if not self.client:
            raise Exception("OpenAI client not initialized")

        try:
            # Prepare input array with user message
            input_data = [
                {"role": "user", "content": [{"type": "input_text", "text": message}]}
            ]

            # Prepare API parameters
            api_params = {
                "model": settings.default_model,
                "input": input_data,
                "text": {"format": {"type": "text"}},
                "reasoning": {},
                "tools": [],
                "temperature": settings.default_temperature,
                "max_output_tokens": settings.default_max_tokens,
                "top_p": settings.default_top_p,
                "store": True,
            }

            # Add previous_response_id if conversation_id is provided
            if conversation_id:
                api_params["previous_response_id"] = conversation_id
                logger.info(
                    f"Continuing conversation with previous_response_id: {conversation_id}"
                )
            else:
                logger.info("Starting new conversation")

            # Make API call to OpenAI responses endpoint
            response = self.client.responses.create(**api_params)
            
            # Extract response data using the correct structure
            response_id = response.id
            
            # Extract message content from the output structure
            if hasattr(response, 'output') and response.output:
                # Get the first output message
                first_message = response.output[0]
                if hasattr(first_message, 'content') and first_message.content:
                    # Get the first content item (which should be the text)
                    first_content = first_message.content[0]
                    if hasattr(first_content, 'text'):
                        response_content = first_content.text
                    else:
                        response_content = "No text found in content"
                else:
                    response_content = "No content found in message"
            else:
                response_content = "No output found in response"
            
            logger.info(f"Response created successfully: {response_id}")
            
            return {
                "response_id": response_id,
                "message": response_content,
                "model": getattr(response, "model", settings.default_model),
                "usage": (
                    response.usage.model_dump()
                    if hasattr(response, "usage") and response.usage
                    else None
                ),
            }

        except Exception as e:
            logger.error(f"Error creating response: {e}")
            logger.error(f"Error type: {type(e)}")
            raise Exception(f"Failed to create response: {str(e)}")


# Global service instance
openai_service = OpenAIService()
