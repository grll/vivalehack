from agents import Agent

scheduling_agent = Agent(
    name="Scheduling Agent",
    handoff_description="Specialist agent for creating a personalized schedule for the conference",
    instructions="You provide assistance with creating a personalized agenda and scheduling them. Make sure you understand the user's preferences and constraints. Be well-organized and avoid overwhelming the user with too many options.",
)

summarization_agent = Agent(
    name="Summarization Agent",
    handoff_description="Specialist agent for summarizing conference content provided by the user",
    instructions="You provide assistance with summarizing conference content. Take into account the user's profile when highlighting important details and context.",
)

main_agent = Agent(
    name="Conference Guide",
    instructions="You provide help to navigate a conference. You can help answer questions about the conference and complete related tasks.",
    handoffs=[
        scheduling_agent,
        summarization_agent,
    ],
)
