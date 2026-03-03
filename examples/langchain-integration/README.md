# LangChain + GoalOS Integration

Use GoalOS with LangChain agents. This example shows how to create a LangChain agent that reads from your intent graph and makes intelligent decisions based on your goals, priorities, and dependencies.

## What This Does

- LangChain agents can read your intent graph
- Build custom tools on top of GoalOS data
- Create goal-aware agents that understand priorities and dependencies
- Combine with other LangChain tools (web search, database queries, etc.)

## Prerequisites

- Python 3.9+
- LangChain 0.1+
- GoalOS installed (`pip install goalos` when published)
- An intent graph file

## Installation

```bash
pip install langchain openai goalos
```

## Usage

See `goalos_langchain.py` for a complete example. Basic usage:

```python
from goalos_langchain import GoalOSToolkit
from langchain.agents import initialize_agent, AgentType

# Create GoalOS toolkit
toolkit = GoalOSToolkit(graph_path="~/.goalos/graph.json")

# Create LangChain agent with GoalOS tools
agent = initialize_agent(
    toolkit.get_tools(),
    llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)

# Ask the agent about your goals
result = agent.run("What are my top priorities this week?")
print(result)
```

## Available Tools

The `GoalOSToolkit` exposes these tools to LangChain:

| Tool | Description |
|------|-------------|
| `goalos_get_priorities` | Get top N goals by priority |
| `goalos_list_goals` | List all goals (with filters) |
| `goalos_get_goal_details` | Get full details of a goal |
| `goalos_search_goals` | Full-text search across goals |
| `goalos_get_blockers` | Get goals blocking a specific goal |
| `goalos_get_dependencies` | Get dependency chain for a goal |

## Example: Goal-Aware Task Agent

```python
from langchain.agents import AgentType, initialize_agent
from langchain.llms import OpenAI
from goalos_langchain import GoalOSToolkit

# Initialize
llm = OpenAI(temperature=0)
toolkit = GoalOSToolkit()
agent = initialize_agent(
    toolkit.get_tools(),
    llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION
)

# Agent understands your goals and priorities
agent.run("""
    I want to work on something important today. 
    What are my top 3 priorities, and what are 
    the next actionable steps for each?
""")
```

## Example: Priority-Aware Planning

```python
from langchain.agents import AgentType, initialize_agent
from langchain.llms import OpenAI
from goalos_langchain import GoalOSToolkit

llm = OpenAI(temperature=0)
toolkit = GoalOSToolkit(graph_path="~/.goalos/graph.json")
agent = initialize_agent(toolkit.get_tools(), llm, verbose=True)

# Agent can help with planning
agent.run("""
    I'm starting my week. Show me:
    1. What's blocking my highest priority goal?
    2. What deadlines are coming up?
    3. What should I focus on today to make the most impact?
""")
```

## Integration with Other Tools

Combine GoalOS with other LangChain tools:

```python
from langchain.agents import AgentType, initialize_agent
from langchain.llms import OpenAI
from langchain.tools import DuckDuckGoSearchRun
from goalos_langchain import GoalOSToolkit

llm = OpenAI(temperature=0)

# Combine tools
tools = (
    GoalOSToolkit().get_tools() +
    [DuckDuckGoSearchRun()]
)

agent = initialize_agent(
    tools,
    llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION
)

# Agent can search web and correlate with your goals
agent.run("""
    What are my top 3 goals in the health domain?
    Search for the latest research on each topic.
""")
```

## Custom Prompts

Customize the agent's behavior with system prompts:

```python
from langchain.agents import AgentType, initialize_agent
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from goalos_langchain import GoalOSToolkit

llm = OpenAI(temperature=0)
toolkit = GoalOSToolkit()

system_prompt = """
You are an AI goal coach. Your job is to:
1. Help the user understand their priorities
2. Identify blockers and dependencies
3. Suggest next steps aligned with top goals
4. Challenge prioritization if needed

Always start by getting the user's priorities.
Respond with specific, actionable advice.
"""

agent = initialize_agent(
    toolkit.get_tools(),
    llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    system_message=system_prompt,
    verbose=True
)

agent.run("Help me plan my week")
```

## Configuration

### Using a Custom Graph Path

```python
toolkit = GoalOSToolkit(
    graph_path="/path/to/my/graph.json"
)
```

### Loading from JSON Data

```python
import json
from goalos_langchain import GoalOSToolkit

with open("my-goals.json") as f:
    graph_data = json.load(f)

toolkit = GoalOSToolkit(graph_data=graph_data)
```

## Troubleshooting

### "No module named 'goalos'"

Install the goalos package:
```bash
pip install goalos
```

If it's not published yet, install from source:
```bash
cd ../goalos-py
pip install -e .
```

### "Graph file not found"

Ensure your graph path is correct:
```bash
ls ~/.goalos/graph.json
```

Create one:
```bash
goalos init
```

## Advanced: Custom Tool Creation

Create domain-specific tools combining GoalOS with other APIs:

```python
from langchain.tools import tool
from goalos import IntentGraph

@tool
def get_prioritized_tasks():
    """Get top priority goals that are actionable today"""
    graph = IntentGraph.from_file("~/.goalos/graph.json")
    
    top_goals = graph.get_top_priorities(n=5)
    actionable = [g for g in top_goals if g.status == 'active']
    
    return "\n".join([f"- {g.title}" for g in actionable])

# Use in agent
agent.tools.append(get_prioritized_tasks)
```

## Next Steps

- Explore the full `goalos_langchain.py` implementation
- Create custom tools for your domain
- Integrate with databases, APIs, or other services
- Build specialized goal-aware agents

## Support

For issues:
- GitHub: https://github.com/Aimaghsoodi/GoalOS/issues
- Discussions: https://github.com/Aimaghsoodi/GoalOS/discussions
