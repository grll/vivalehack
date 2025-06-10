from agents import Agent, InputGuardrail, GuardrailFunctionOutput, Runner
from pydantic import BaseModel
from .scheduling_agent import scheduling_agent
from .summarization_agent import summarization_agent


class VivaTechConference(BaseModel):
    is_viva_tech_conference: bool
    reasoning: str


guardrail_agent = Agent(
    name="Guardrail check",
    instructions="Check if the user is asking about the Viva Tech Conference.",
    output_type=VivaTechConference,
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
