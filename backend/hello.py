import asyncio

from agents import Agent, Runner
from agents.mcp import MCPServerStdio
from dotenv import load_dotenv

load_dotenv()


async def main():
    async with MCPServerStdio(
        params={
            "command": "node",
            "args": [
                "../google-calendar-mcp/build/index.js",
            ],
            "env": {
                "GOOGLE_OAUTH_CREDENTIALS": "./client_secret_880305968716-9hfslr0mq5o5869bggpvc687561hai99.apps.googleusercontent.com.json"
            },
        },
        cache_tools_list=True,
    ) as google_calendar_server:
        agent = Agent(
            name="Scheduler",
            instructions="""
TODAY is 2025-06-10.
Use the to schedule an event today at 16:00.
ALWAYS use isoformat for the date and time (e.g., 2024-01-01T00:00:00Z).
            """,
            mcp_servers=[google_calendar_server],
        )

        result = await Runner.run(agent, "Schedule a conference about MCP.")
        print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
