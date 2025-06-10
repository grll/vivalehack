from agents import Agent, handoff, Runner, trace
import asyncio
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

import asyncio
from typing import Dict, List, Any
from concurrent.futures import ThreadPoolExecutor

class ConversationManager:
    """
    A class to manage conversations with an agent, maintaining history and providing
    a clean interface for executing prompts and getting responses.
    """
    
    def __init__(self, agent: Agent, workflow_name: str = "Conversation"):
        """
        Initialize the conversation manager.
        
        Args:
            agent: The Agent instance to use for conversations
            workflow_name: Name for the trace workflow
            default_group_id: Default group ID for the trace when none is specified
        """
        self.agent = agent
        self.workflow_name = workflow_name
        # Dictionary to store conversation history for each group_id
        self.conversation_histories: Dict[str, List[Dict[str, str]]] = {}
        # Dictionary to store last result for each group_id
        self.last_results: Dict[str, Any] = {}
        # Dictionary to track initialization status for each group_id
        self.group_initialized: Dict[str, bool] = {}
        # Dictionary to store summaries for each group_id
        self.group_summaries: Dict[str, str] = {}
        # Global summary across all groups
        self.global_summary: str = ""

    
    async def update_global_summary(self, context):
        """
        Update the global summary based on all group summaries.
        """
        if not context or (isinstance(context, str) and context.strip() == ""):
            print("Empty context")
            return  # Just skip if context is empty
        try:
            # Load global summary from summary.md if it exists
            summary_path = "summary.md"
            if os.path.exists(summary_path):
                try:
                    # Read the file content as a string
                    with open("summary.md", "r") as file:
                        content = file.read().rstrip()
                        # Append content to history
                        self.global_summary = content
                    print("Summary.md read and added to history.")
                    #print(content)
                except Exception as e:
                    print(f"Error reading summary.md: {e}")
            else:
                print("summary.md file does not exist.")


            global_summary_prompt = f"""Please provide a summary that synthesizes the following group conversation summaries:

{context}
{self.global_summary}

Provide only high-level overviews that captures the key themes, decisions, and outcomes across all conversations:"""
        

            with trace(workflow_name=f"{self.workflow_name}_GlobalSummary", group_id="global_summary"):
                result = await Runner.run(self.agent, global_summary_prompt)
                self.global_summary = result.final_output
                with open("summary.md", "w", encoding="utf-8") as f:
                    f.write(f"\n{self.global_summary}\n")
        except Exception as e:
            self.global_summary = f"Error creating global summary: {e}"

# # Example usage
# async def main():
#     # Initialize your agent (this is just an example)
#     # agent = Agent(...)  # Your agent initialization here
#     summary_agent = Agent(model="o3-mini", name="Assistant", instructions="Reply very concisely.")
#     # Create conversation manager with memory
#     summary_agent_handle = ConversationManager(summary_agent)

#     await summary_agent_handle.update_global_summary("due to wether I prefer to do running over tennis")
#     pass

# if __name__ == "__main__":
#     asyncio.run(main())