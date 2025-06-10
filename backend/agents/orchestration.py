from agents import (
    Agent,
    InputGuardrail,
    GuardrailFunctionOutput,
    Runner,
    InputGuardrailTripwireTriggered,
)
from pydantic import BaseModel
from scheduling_agent import scheduling_agent
from summarization_agent import summarization_agent
from networking_agent import networking_agent
import asyncio


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
    instructions="You provide help to navigate Viva Tech Conference. You can help answer questions about the conference and complete related tasks. You decide which agent to handoff to based on the user's request.",
    handoffs=[
        scheduling_agent,
        summarization_agent,
        networking_agent,
    ],
)


async def main():
    while True:
        user_input = input(
            "\nWhat would you like to know about VivaTech? (or type 'exit' to quit): "
        )
        if user_input.lower() == "exit":
            break
        try:
            result = await Runner.run(main_agent, user_input)
            print("\n" + result.final_output)
        except InputGuardrailTripwireTriggered:
            print(
                "\nI'm sorry, I can only help with VivaTech Conference related questions."
            )


if __name__ == "__main__":
    asyncio.run(main())
