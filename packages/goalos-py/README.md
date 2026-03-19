# GoalOS Python SDK

GoalOS is a personal AI intent graph for coordinating goals, priorities, dependencies, and permissions across agents.

## Install

```bash
pip install goalos
```

## Quick Start

```python
from goalos import GoalManager, IntentGraphManager, Priority

goal = GoalManager.create(
    title="Ship GoalOS Python SDK",
    priority=Priority(level="high", score=85),
    domain="work",
)

graph = IntentGraphManager.create(owner="user123", name="Launch Plan")
graph.add_goal(title=goal.title, priority=goal.priority, domain=goal.domain)

print(graph.to_json_str())
```

## What’s Included

- Goal models and validation
- Intent graph CRUD and traversal
- Dependency and permission helpers
- Query, priority, and serialization utilities

