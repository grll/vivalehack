from agents import Agent, handoff, Runner, trace
import asyncio
from typing import List, Dict, Any, Optional

class ConversationManager:
    """
    A class to manage conversations with an agent, maintaining history and providing
    a clean interface for executing prompts and getting responses.
    """
    
    def __init__(self, agent: Agent, workflow_name: str = "Conversation", group_id: str = "1"):
        """
        Initialize the conversation manager.
        
        Args:
            agent: The Agent instance to use for conversations
            workflow_name: Name for the trace workflow
            group_id: Group ID for the trace
        """
        self.agent = agent
        self.workflow_name = workflow_name
        self.group_id = group_id
        self.conversation_history: List[Dict[str, str]] = []
        self.last_result = None
        self._is_initialized = False
    
    async def execute(self, prompt: str) -> str:
        """
        Execute a prompt with the agent and return the response.
        Automatically manages conversation history.
        
        Args:
            prompt: The user prompt/message
            
        Returns:
            The agent's response as a string
            
        Raises:
            Exception: If there's an error during execution
        """
        try:
            with trace(workflow_name=self.workflow_name, group_id=self.group_id):
                if not self._is_initialized:
                    # First turn - use prompt directly
                    result = await Runner.run(self.agent, prompt)
                    self._is_initialized = True
                else:
                    # Subsequent turns - build conversation history + new input
                    conversation_input = self.last_result.to_input_list() + [{"role": "user", "content": prompt}]
                    result = await Runner.run(self.agent, conversation_input)
                
                # Store the result for next turn
                self.last_result = result
                
                # Add to our internal history for tracking
                self.conversation_history.append({"role": "user", "content": prompt})
                self.conversation_history.append({"role": "assistant", "content": result.final_output})
                
                return result.final_output
                
        except Exception as e:
            raise Exception(f"Error executing prompt: {e}")
    
    def get_history(self) -> List[Dict[str, str]]:
        """
        Get the full conversation history.
        
        Returns:
            List of conversation turns with role and content
        """
        return self.conversation_history.copy()
    
    def clear_history(self):
        """Clear the conversation history and reset the manager."""
        self.conversation_history = []
        self.last_result = None
        self._is_initialized = False
    
    def get_last_response(self) -> Optional[str]:
        """
        Get the last agent response.
        
        Returns:
            The last response string, or None if no conversation yet
        """
        if self.conversation_history and self.conversation_history[-1]["role"] == "assistant":
            return self.conversation_history[-1]["content"]
        return None
    
    async def interactive_loop(self, initial_prompt: str = None):
        """
        Start an interactive conversation loop.
        
        Args:
            initial_prompt: Optional initial prompt to start with
        """
        if initial_prompt:
            try:
                response = await self.execute(initial_prompt)
                print(f"Agent: {response}")
            except Exception as e:
                print(f"Error: {e}")
                return
        
        print("Starting interactive conversation (type 'quit', 'exit', or 'bye' to end)")
        
        while True:
            try:
                user_input = input("You: ")
                
                # Exit conditions
                if user_input.lower().strip() in ['quit', 'exit', 'bye', '']:
                    print("Goodbye!")
                    break
                
                # Execute the prompt
                response = await self.execute(user_input)
                print(f"Agent: {response}")
                
            except KeyboardInterrupt:
                print("\nGoodbye!")
                break
            except Exception as e:
                print(f"Error: {e}")
                break


# # Example usage
# async def main():
#     # Create agent
#     agent = Agent(name="Assistant", instructions="Reply very concisely.")
    
#     # Create conversation manager
#     conversation = ConversationManager(agent, workflow_name="MyConversation", group_id="session_1")
    
#     # Example 1: Single prompt execution
#     try:
#         response = await conversation.execute("What is the capital of France?")
#         print(f"Response: {response}")
        
#         # Follow-up question
#         response = await conversation.execute("What's the population of that city?")
#         print(f"Response: {response}")
        
#         # Print conversation history
#         print("\nConversation History:")
#         for turn in conversation.get_history():
#             print(f"{turn['role'].title()}: {turn['content']}")
            
#     except Exception as e:
#         print(f"Error: {e}")

# if __name__ == "__main__":
#     # Run the main example
#     asyncio.run(main())
    