from agents import Agent, handoff, Runner, trace
import asyncio
from typing import List, Dict, Any, Optional


class ConversationManager:
    """
    A class to manage conversations with an agent, maintaining history and providing
    a clean interface for executing prompts and getting responses.
    """

    def __init__(
        self,
        agent: Agent,
        workflow_name: str = "Conversation",
        default_group_id: str = "1",
    ):
        """
        Initialize the conversation manager.

        Args:
            agent: The Agent instance to use for conversations
            workflow_name: Name for the trace workflow
            default_group_id: Default group ID for the trace when none is specified
        """
        self.agent = agent
        self.workflow_name = workflow_name
        self.default_group_id = default_group_id
        # Dictionary to store conversation history for each group_id
        self.conversation_histories: Dict[str, List[Dict[str, str]]] = {}
        # Dictionary to store last result for each group_id
        self.last_results: Dict[str, any] = {}
        # Dictionary to track initialization status for each group_id
        self.group_initialized: Dict[str, bool] = {}

    async def execute(self, prompt: str, group_id: str = None) -> str:
        """
        Execute a prompt with the agent and return the response.
        Automatically manages conversation history per group_id.

        Args:
            prompt: The user prompt/message
            group_id: Group ID for the trace and conversation history (optional)

        Returns:
            The agent's response as a string

        Raises:
            Exception: If there's an error during execution
        """
        # Use default group_id if none provided
        if group_id is None:
            group_id = self.default_group_id
            
        print(group_id, self.last_results)

        # Initialize group-specific storage if needed
        if group_id not in self.conversation_histories:
            self.conversation_histories[group_id] = []
            self.last_results[group_id] = None
            self.group_initialized[group_id] = False

        try:
            with trace(workflow_name=self.workflow_name, group_id=group_id):
                if not self.group_initialized[group_id]:
                    # First turn for this group - use prompt directly
                    result = await Runner.run(self.agent, prompt)
                    self.group_initialized[group_id] = True
                else:
                    # Subsequent turns - build conversation history + new input
                    conversation_input = self.last_results[group_id].to_input_list() + [
                        {"role": "user", "content": prompt}
                    ]
                    result = await Runner.run(
                        self.agent,
                        conversation_input,
                    )

                # Store the result for next turn in this group
                self.last_results[group_id] = result

                # Add to our internal history for this group
                self.conversation_histories[group_id].append(
                    {"role": "user", "content": prompt}
                )
                self.conversation_histories[group_id].append(
                    {"role": "assistant", "content": result.final_output}
                )

                return result.final_output

        except Exception as e:
            raise Exception(f"Error executing prompt for group {group_id}: {e}")

    def get_history(self, group_id: str = None) -> List[Dict[str, str]]:
        """
        Get the full conversation history for a specific group.

        Args:
            group_id: Group ID to get history for (optional, uses default if not provided)

        Returns:
            List of conversation turns with role and content for the specified group
        """
        if group_id is None:
            group_id = self.default_group_id

        return self.conversation_histories.get(group_id, []).copy()

    def get_all_histories(self) -> Dict[str, List[Dict[str, str]]]:
        """
        Get conversation histories for all groups.

        Returns:
            Dictionary mapping group_id to conversation history
        """
        return {
            group_id: history.copy()
            for group_id, history in self.conversation_histories.items()
        }

    def clear_history(self, group_id: str = None):
        """
        Clear the conversation history and reset the manager for a specific group.

        Args:
            group_id: Group ID to clear (optional, uses default if not provided)
        """
        if group_id is None:
            group_id = self.default_group_id

        if group_id in self.conversation_histories:
            self.conversation_histories[group_id] = []
            self.last_results[group_id] = None
            self.group_initialized[group_id] = False

    def clear_all_histories(self):
        """Clear all conversation histories and reset the manager completely."""
        self.conversation_histories = {}
        self.last_results = {}
        self.group_initialized = {}

    def get_last_response(self, group_id: str = None) -> Optional[str]:
        """
        Get the last agent response for a specific group.

        Args:
            group_id: Group ID to get last response for (optional, uses default if not provided)

        Returns:
            The last response string, or None if no conversation yet for this group
        """
        if group_id is None:
            group_id = self.default_group_id

        history = self.conversation_histories.get(group_id, [])
        if history and history[-1]["role"] == "assistant":
            return history[-1]["content"]
        return None

    def get_active_groups(self) -> List[str]:
        """
        Get a list of all group IDs that have conversation history.

        Returns:
            List of group IDs with active conversations
        """
        return list(self.conversation_histories.keys())

    async def interactive_loop(self, initial_prompt: str = None, group_id: str = None):
        """
        Start an interactive conversation loop for a specific group.

        Args:
            initial_prompt: Optional initial prompt to start with
            group_id: Group ID for the conversation (optional, uses default if not provided)
        """
        if group_id is None:
            group_id = self.default_group_id

        print(f"Starting conversation for group: {group_id}")

        if initial_prompt:
            try:
                response = await self.execute(initial_prompt, group_id)
                print(f"Agent: {response}")
            except Exception as e:
                print(f"Error: {e}")
                return

        print(
            "Starting interactive conversation (type 'quit', 'exit', or 'bye' to end)"
        )

        while True:
            try:
                user_input = input(f"You (Group {group_id}): ")

                # Exit conditions
                if user_input.lower().strip() in ["quit", "exit", "bye", ""]:
                    print("Goodbye!")
                    break

                # Execute the prompt
                response = await self.execute(user_input, group_id)
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
#     conversation = ConversationManager(agent, workflow_name="MyConversation", default_group_id="session_1")

#     # Example 1: Single prompt execution
#     try:
#         response = await conversation.execute("My name is Hojjat.", group_id="session_1")
#         print(f"Response: {response}")

#         # Follow-up question
#         response = await conversation.execute("What's my name?", group_id="session_1")
#         print(f"Response: {response}")

#         response = await conversation.execute("My name is Yousuf.", group_id="session_2")
#         print(f"Response: {response}")

#         # Follow-up question
#         response = await conversation.execute("What's my name?", group_id="session_2")
#         print(f"Response: {response}")

#                 # Follow-up question
#         response = await conversation.execute("What's my name?", group_id="session_1")
#         print(f"Response: {response}")

#         # Print conversation history
#         #print("\nConversation History:")
#         #for turn in conversation.get_history():
#         #    print(f"{turn['role'].title()}: {turn['content']}")

#     except Exception as e:
#         print(f"Error: {e}")

# if __name__ == "__main__":
#     # Run the main example
#     asyncio.run(main())
