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

    
    async def execute(self, context):
        """
        Update the global summary based on all group summaries.
        """

        global_summary_prompt = f"""Please provide a summary that synthesizes the following group conversation summaries: \n\n{context}\n\nProvide only high-level overviews that captures the key themes, decisions, and outcomes across all conversations:"""

        try: 
            with trace(workflow_name=f"{self.workflow_name}_GlobalSummary", group_id="global_summary"):
                result = await Runner.run(self.agent, global_summary_prompt)
                return result.final_output
        except Exception as e:
            return ""

# Example usage
async def main():

    inputs = """
In your code snippet, the max_seq_length=3000 inside SFTConfig refers to the maximum input sequence length (i.e., the maximum length of tokenized input sequences the model will be trained or evaluated on).

Clarifying the Terminology:
	•	max_seq_length: This typically controls how long the tokenized input can be. Inputs longer than this will be truncated, and shorter inputs may be padded.
	•	It does not directly control the maximum output length during generation. Output length is controlled by a separate parameter (e.g., max_new_tokens, max_length in generate() or inference-time settings).

In the context of SFTTrainer:

max_seq_length=3000 sets the limit for the tokenized input length passed to the model during fine-tuning (supervised fine-tuning, or SFT). If any input text gets tokenized into more than 3000 tokens, it will be truncated.

"""

    # Initialize your agent (this is just an example)
    # agent = Agent(...)  # Your agent initialization here
    summary_agent = Agent(model="o3-mini", name="Assistant", instructions="Reply very concisely.")
    # Create conversation manager with memory
    summary_agent_handle = ConversationManager(summary_agent)

    response = await summary_agent_handle.execute(inputs)
    print(response)
    pass

if __name__ == "__main__":
    asyncio.run(main())