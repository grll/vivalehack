from agents import Agent, InputGuardrail, GuardrailFunctionOutput, Runner
from pydantic import BaseModel


class VivaTechConference(BaseModel):
    is_viva_tech_conference: bool
    reasoning: str


guardrail_agent = Agent(
    name="Guardrail check",
    instructions="Check if the user is asking about the Viva Tech Conference.",
    output_type=VivaTechConference,
)

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


async def viva_tech_conference_guardrail(ctx, agent, input_data):
    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)
    final_output = result.final_output_as(VivaTechConference)
    return GuardrailFunctionOutput(
        output_info=final_output,
        tripwire_triggered=not final_output.is_viva_tech_conference,
    )


main_agent = Agent(
    name="Conference Guide",
    instructions="You provide help to navigate Viva Tech Conference. You can help answer questions about the conference and complete related tasks. You decide which agent to handoff to based on the user's request. If the user is not asking about the Viva Tech Conference, apologize and say that you can only help with Viva Tech Conference related questions.",
    handoffs=[
        scheduling_agent,
        summarization_agent,
    ],
    input_guardrails=[InputGuardrail(guardrail_function=viva_tech_conference_guardrail)],
)
