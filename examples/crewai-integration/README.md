# CrewAI + GoalOS Integration

Use GoalOS with CrewAI teams of agents. This example shows how to create a CrewAI crew where agents have access to your intent graph and can coordinate around shared goals.

## What This Does

- CrewAI agents can read and understand your intent graph
- Build multi-agent teams that coordinate around goals
- Agents share context about priorities and dependencies
- Leverage goal data for task assignment and prioritization

## Prerequisites

- Python 3.9+
- CrewAI 0.1+
- GoalOS installed
- OpenAI API key (for LLM)

## Installation

```bash
pip install crewai openai goalos
```

## Usage

See `goalos_crewai.py` for a complete example. Basic usage:

```python
from goalos_crewai import GoalOSTeam
from crewai import Agent, Task

# Create goal-aware team
team = GoalOSTeam(graph_path="~/.goalos/graph.json")

# Create agents with goal context
planner = Agent(
    role="Goal Coordinator",
    goal="Help plan work around user's goals",
    tools=team.get_tools(),
    ...
)

# Create tasks that reference goals
task = Task(
    description="Plan this week's work around high-priority goals",
    agent=planner,
    tools=team.get_tools()
)

# Execute crew
crew.execute()
```

## Example Crew Configuration

```python
from goalos_crewai import GoalOSTeam
from crewai import Agent, Task, Crew
from langchain.llms import OpenAI

# Initialize goal context
team = GoalOSTeam(graph_path="~/.goalos/graph.json")

# Define agents with access to goals
planner = Agent(
    role="Weekly Planner",
    goal="Create a weekly plan based on priorities and deadlines",
    backstory="You are an expert at planning. You understand goal hierarchies.",
    tools=team.get_tools(),
    llm=OpenAI(model="gpt-4")
)

blocker_resolver = Agent(
    role="Blocker Resolver", 
    goal="Identify and help resolve goals that are blocked",
    backstory="You are expert at dependency management.",
    tools=team.get_tools(),
    llm=OpenAI(model="gpt-4")
)

# Define tasks
task1 = Task(
    description="What are my top 3 priorities this week? List them with deadlines.",
    agent=planner,
    tools=team.get_tools(),
    expected_output="Prioritized list of goals with dates and success criteria"
)

task2 = Task(
    description="Which of my goals are blocked? What can we unblock first?",
    agent=blocker_resolver,
    tools=team.get_tools(),
    expected_output="Analysis of blocked goals and recommendations"
)

# Create and execute crew
crew = Crew(
    agents=[planner, blocker_resolver],
    tasks=[task1, task2],
    verbose=True,
    process=Process.sequential
)

result = crew.kickoff()
print(result)
```

## Available Tools for Agents

The `GoalOSTeam` provides agents with these tools:

| Tool | Description |
|------|-------------|
| `goalos_get_context` | High-level summary of goal landscape |
| `goalos_list_goals` | List goals with filters |
| `goalos_get_goal` | Get full details of a goal |
| `goalos_search_goals` | Search across goals |
| `goalos_get_blockers` | Find blocking goals |
| `goalos_get_deadlines` | Get upcoming deadlines |

## Example: Goal-Aware Daily Planning

```python
from goalos_crewai import GoalOSTeam
from crewai import Agent, Task, Crew, Process
from langchain.llms import OpenAI

# Load goals
team = GoalOSTeam()

# Planning agent
daily_planner = Agent(
    role="Daily Planner",
    goal="Create an optimal daily schedule",
    backstory="""
        You are an expert at daily planning. You understand:
        - User goals and priorities
        - Task dependencies
        - Time constraints
        - Goal blocking relationships
        
        Create a daily schedule that:
        1. Focuses on high-priority goals
        2. Removes blockers first
        3. Makes progress on critical path items
        4. Leaves buffer for urgent tasks
    """,
    tools=team.get_tools(),
    llm=OpenAI(model="gpt-4"),
    verbose=True
)

# Create planning task
planning_task = Task(
    description="""
        Create my ideal daily plan for today based on:
        1. Top priority goals
        2. Upcoming deadlines
        3. Goal dependencies
        4. Blocked goals that could be unblocked
        
        Output a time-blocked schedule with specific goal work.
    """,
    agent=daily_planner,
    expected_output="Hour-by-hour schedule with goal-specific actions"
)

# Run planner
crew = Crew(
    agents=[daily_planner],
    tasks=[planning_task]
)

schedule = crew.kickoff()
print(schedule)
```

## Example: Multi-Agent Goal Discussion

```python
from goalos_crewai import GoalOSTeam
from crewai import Agent, Task, Crew, Process

team = GoalOSTeam()

# Strategic advisor
strategist = Agent(
    role="Strategic Advisor",
    goal="Provide strategic guidance on goals",
    tools=team.get_tools(),
    llm=OpenAI(model="gpt-4")
)

# Tactical executor
executor = Agent(
    role="Tactical Executor",
    goal="Break down goals into actionable steps",
    tools=team.get_tools(),
    llm=OpenAI(model="gpt-4")
)

# Strategic task
strategy_task = Task(
    description="""
        Review the user's goals and assess:
        1. Strategic alignment between goals
        2. Any conflicting priorities
        3. Recommended focus areas
        4. Missing dependencies
        
        Provide strategic guidance.
    """,
    agent=strategist,
    tools=team.get_tools()
)

# Execution task
execution_task = Task(
    description="""
        Based on the strategy, create a breakdown of this week's work:
        1. Top 3 goals to focus on
        2. Sub-tasks for each
        3. Success metrics
        4. Dependency order
    """,
    agent=executor,
    tools=team.get_tools(),
    context=[strategy_task]
)

# Run crew
crew = Crew(
    agents=[strategist, executor],
    tasks=[strategy_task, execution_task],
    process=Process.sequential,
    verbose=True
)

result = crew.kickoff()
print(result)
```

## Configuration

### Custom Graph Path

```python
team = GoalOSTeam(graph_path="/path/to/goals.json")
```

### In-Memory Graph Data

```python
import json

with open("goals.json") as f:
    graph_data = json.load(f)

team = GoalOSTeam(graph_data=graph_data)
```

## Advanced: Custom Tools

Extend with domain-specific tools:

```python
from langchain.tools import tool
from goalos_crewai import GoalOSTeam

team = GoalOSTeam()
base_tools = team.get_tools()

@tool
def get_urgent_goals():
    """Get goals with deadlines in next 3 days"""
    graph = team.graph
    return [
        g for g in graph.goals
        if g.deadline and days_until_deadline(g.deadline) <= 3
    ]

@tool
def estimate_work_remaining():
    """Estimate total work remaining for all active goals"""
    graph = team.graph
    active = graph.get_by_status("active")
    return sum(
        g.estimated_effort.value 
        for g in active if g.estimated_effort
    )

# Add to tools
all_tools = base_tools + [get_urgent_goals, estimate_work_remaining]

# Use in agents
agent = Agent(
    role="Project Manager",
    tools=all_tools,
    ...
)
```

## Troubleshooting

### "No module named 'goalos'"

Install from source:
```bash
cd ../goalos-py
pip install -e .
```

### CrewAI agents can't access tools

Ensure tools are passed to agent:
```python
agent = Agent(
    tools=team.get_tools(),  # Make sure this is included
    ...
)
```

## Next Steps

- Read the full `goalos_crewai.py` implementation
- Create specialized crew configurations for your domain
- Combine with external tools (APIs, databases, etc.)
- Build multi-stage pipelines with goal-aware agents

## Support

For questions or issues:
- GitHub: https://github.com/Aimaghsoodi/GoalOS/issues
- Discussions: https://github.com/Aimaghsoodi/GoalOS/discussions
