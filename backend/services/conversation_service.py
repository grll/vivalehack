from agents import Agent, FileSearchTool
from memory.context_manager import ConversationManager
from config import settings
from typing import Dict, Any, Optional
import logging
import os
import time
import json
import sys

# Add parent directory to path to access conference_agent
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Import main_agent from conference_agent
from conference_agent.agent import main_agent

logger = logging.getLogger(__name__)


class ConversationService:
    """Service for managing conversations using the ConversationManager"""

    def __init__(self):
        """Initialize the conversation service with a default agent"""
        try:
            # Set OpenAI API key as environment variable if not already set
            if not os.getenv("OPENAI_API_KEY") and settings.openai_api_key:
                os.environ["OPENAI_API_KEY"] = settings.openai_api_key

            # Read instructions from file
            instructions = self._load_instructions()

            # Load user info and append to instructions if available
            user_info = self._load_user_info()
            final_instructions = instructions
            if user_info:
                final_instructions = instructions + f"\n\nUser info:\n{user_info}"

            # Use main_agent from conference_agent but update instructions and name
            self.agent = main_agent
            # Update the agent's name and instructions for VivaTech 2025
            self.agent.name = "VivaTech 2025 Assistant"
            self.agent.instructions = final_instructions

            # Initialize the conversation manager with the agent
            self.conversation_manager = ConversationManager(
                agent=self.agent,
                workflow_name="VivaTechConversation",
                default_group_id="default",
            )

            self._initialized = True
            logger.info(
                "Conversation service initialized successfully with VivaTech 2025 instructions using main_agent"
            )
            if user_info:
                logger.info(
                    "User profile information loaded and included in agent instructions"
                )

        except Exception as e:
            logger.error(f"Failed to initialize conversation service: {e}")
            self._initialized = False
            raise

    def _load_user_info(self) -> Optional[str]:
        """Load user information from user.json file and format for instructions"""
        try:
            # Get the path to user.json (should be in the backend directory)
            user_json_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), "user.json"
            )

            if not os.path.exists(user_json_path):
                logger.info("No user.json file found - proceeding without user info")
                return None

            with open(user_json_path, "r", encoding="utf-8") as f:
                user_data = json.load(f)

            # Check if user_data is empty or doesn't have essential fields
            if not user_data or not user_data.get("firstName"):
                logger.info(
                    "user.json is empty or missing essential fields - proceeding without user info"
                )
                return None

            # Extract relevant fields for the AI assistant
            user_info_parts = []

            # Basic info
            if user_data.get("firstName") and user_data.get("lastName"):
                user_info_parts.append(
                    f"Name: {user_data['firstName']} {user_data['lastName']}"
                )

            # Professional info
            if user_data.get("headline"):
                user_info_parts.append(
                    f"Professional headline: {user_data['headline']}"
                )

            if user_data.get("jobTitle") and user_data.get("companyName"):
                user_info_parts.append(
                    f"Current position: {user_data['jobTitle']} at {user_data['companyName']}"
                )

            # Contact info
            if user_data.get("email"):
                user_info_parts.append(f"Email: {user_data['email']}")

            # Location
            if user_data.get("addressWithCountry"):
                user_info_parts.append(f"Location: {user_data['addressWithCountry']}")

            # About section
            if user_data.get("about"):
                user_info_parts.append(f"About: {user_data['about']}")

            # LinkedIn profile
            if user_data.get("linkedinUrl"):
                user_info_parts.append(f"LinkedIn: {user_data['linkedinUrl']}")

            # Recent experience (just the current one)
            experiences = user_data.get("experiences", [])
            if experiences and len(experiences) > 0:
                current_exp = experiences[0]  # First one is usually current
                if current_exp.get("title") and current_exp.get("subtitle"):
                    duration = current_exp.get("caption", "")
                    user_info_parts.append(
                        f"Current role: {current_exp['title']} at {current_exp['subtitle']} ({duration})"
                    )

            if user_info_parts:
                user_info_text = "\n".join(user_info_parts)
                logger.info(f"Loaded user info with {len(user_info_parts)} fields")
                return user_info_text
            else:
                logger.info("No relevant user info fields found")
                return None

        except json.JSONDecodeError as e:
            logger.error(f"Error parsing user.json: {e}")
            return None
        except Exception as e:
            logger.error(f"Error loading user info: {e}")
            return None

    def _load_instructions(self) -> str:
        """Load instructions from the instructions.txt file"""
        try:
            # Get the path to instructions.txt (should be in the backend directory)
            instructions_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), "instructions.txt"
            )

            if os.path.exists(instructions_path):
                with open(instructions_path, "r", encoding="utf-8") as f:
                    instructions = f.read().strip()
                logger.info(
                    f"Loaded instructions from {instructions_path} ({len(instructions)} characters)"
                )
                return instructions
            else:
                logger.warning(
                    f"Instructions file not found at {instructions_path}, using default instructions"
                )
                return self._get_default_instructions()

        except Exception as e:
            logger.error(f"Error loading instructions from file: {e}")
            return self._get_default_instructions()

    def _get_default_instructions(self) -> str:
        """Get default instructions if file is not available"""
        return """You are an AI assistant for VivaTech 2025.
You provide clear, friendly, and accurate general information about the event.
You can answer questions about dates, location, themes, stages, award ceremonies, main topics, networking events,
and highlight special features such as women in tech, sustainability, AI, and startups.
Guide users to relevant areas of the program and help them get the most out of their VivaTech experience.
Always be welcoming and helpful in your responses."""

    def is_initialized(self) -> bool:
        """Check if the service is properly initialized"""
        return self._initialized

    async def create_response(
        self, message: str, conversation_id: str
    ) -> Dict[str, Any]:
        """
        Create a response using the ConversationManager

        Args:
            message: User input message
            conversation_id: Conversation ID (group_id for context manager)

        Returns:
            Dict containing response_id and message
        """
        # Start total timing
        total_start_time = time.perf_counter()

        try:
            if not self._initialized:
                raise Exception("Conversation service not properly initialized")

            logger.info(f"Creating response for conversation {conversation_id}")

            # Time the conversation manager execution
            cm_start_time = time.perf_counter()

            # Use the conversation manager to execute with the correct parameter name
            response_text = await self.conversation_manager.execute(
                prompt=message, group_id=conversation_id
            )

            cm_end_time = time.perf_counter()
            cm_duration = cm_end_time - cm_start_time

            # Time the response data creation
            response_start_time = time.perf_counter()

            # Create response data in expected format
            response_data = {
                "response_id": conversation_id,  # Use conversation_id as response_id
                "message": response_text,
            }

            response_end_time = time.perf_counter()
            response_duration = response_end_time - response_start_time

            # Calculate total time
            total_end_time = time.perf_counter()
            total_duration = total_end_time - total_start_time

            # Log detailed timing information
            logger.info(f"⏱️  TIMING ANALYSIS for conversation {conversation_id}:")
            logger.info(
                f"   📝 ConversationManager.execute(): {cm_duration:.3f} seconds"
            )
            logger.info(
                f"   📦 Response data creation: {response_duration:.6f} seconds"
            )
            logger.info(f"   🎯 TOTAL function time: {total_duration:.3f} seconds")

            # Also log at INFO level for easy monitoring
            print(
                f"🚀 PERFORMANCE: Total response time = {total_duration:.3f}s (CM execute = {cm_duration:.3f}s)"
            )

            logger.info(
                f"Response created successfully for conversation {conversation_id}"
            )
            return response_data

        except Exception as e:
            total_end_time = time.perf_counter()
            total_duration = total_end_time - total_start_time
            logger.error(
                f"Error creating response after {total_duration:.3f} seconds: {e}"
            )
            raise Exception(f"Failed to create response: {str(e)}")

    def get_conversation_history(self, conversation_id: str) -> list:
        """
        Get conversation history for a specific conversation

        Args:
            conversation_id: Conversation ID

        Returns:
            List of conversation history
        """
        return self.conversation_manager.get_history(conversation_id)

    def clear_conversation(self, conversation_id: str):
        """
        Clear conversation history for a specific conversation

        Args:
            conversation_id: Conversation ID to clear
        """
        self.conversation_manager.clear_history(conversation_id)

    def get_active_conversations(self) -> list:
        """
        Get list of active conversation IDs

        Returns:
            List of conversation IDs with active conversations
        """
        return self.conversation_manager.get_active_groups()


# Global service instance
conversation_service = ConversationService()
