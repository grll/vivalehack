import asyncio

from agents import Agent, Runner
from agents.mcp import MCPServerStdio
from dotenv import load_dotenv

load_dotenv()


async def main():
    async with MCPServerStdio(
        params={
            "command": "npx",
            "args": [
                "-y",
                "@cocal/google-calendar-mcp",
            ],
            "env": {
                "GOOGLE_OAUTH_CREDENTIALS": "./client_secret_880305968716-9hfslr0mq5o5869bggpvc687561hai99.apps.googleusercontent.com.json"
            },
        },
        cache_tools_list=True,
    ) as google_calendar_server:
        agent = Agent(
            name="Scheduler",
            instructions="Use the to schedule an event today at 14:00.",
            mcp_servers=[google_calendar_server],
        )

        result = await Runner.run(agent, "Schedule a conference about MCP.")
        print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
