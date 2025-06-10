from agents import Agent


summarization_agent = Agent(
    name="Summarization Agent",
    handoff_description="Specialist agent for summarizing conference content provided by the user",
    instructions="You provide assistance with summarizing conference content. Take into account the user's profile when highlighting important details and context.",
)
