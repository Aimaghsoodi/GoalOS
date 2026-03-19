# GoalOS Python SDK

GoalOS is a personal AI intent graph for coordinating goals, priorities, dependencies, and permissions across agents.

## Install

```bash
pip install goalos
```

## Quick Start

```python
from goalos import GoalManager, IntentGraphManager, Priority

graph = IntentGraphManager.create(owner="user123", name="Launch Plan")
goal = GoalManager.create(
    title="Ship GoalOS Python SDK",
    priority=Priority(level="high", score=85),
    domain="work",
)

graph.add_goal(title=goal.title, priority=goal.priority, domain=goal.domain)

print(f"Goal: {goal.title}")
print(f"Status: {goal.status}")
print(f"Graph goals: {graph.get_stats().totalGoals}")
```

## Output

```text
Goal: Ship GoalOS Python SDK
Status: planned
Graph goals: 1
```

## What's Included

- Goal models and validation
- Intent graph CRUD and traversal
- Dependency and permission helpers
- Query, priority, and serialization utilities
