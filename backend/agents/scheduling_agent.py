from agents import Agent, function_tool, WebSearchTool
import os

PATH_TO_SCHEDULE = os.path.join(os.path.dirname(__file__), "..", "data", "vivatech_agenda.md")


@function_tool
def get_full_schedule() -> str:  # TODO: maybe add an option for day/time?
    """
    Get the full schedule for the VivaTech Conference.
    """
    with open(PATH_TO_SCHEDULE, "r") as f:
        return f.read()


scheduling_agent = Agent(
    name="Scheduling Agent",
    handoff_description="Specialist agent for creating a personalized schedule for the conference",
    instructions="You provide assistance with creating a personalized agenda and scheduling them. Make sure you understand the user's preferences and constraints. Be well-organized and avoid overwhelming the user with too many options.",
    tools=[get_full_schedule],
)
