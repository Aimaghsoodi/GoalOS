# GoalOS Python SDK

Use GoalOS intent graphs in Python applications.

## Installation

pip install goalos

## Basic Usage

```python
from goalos import IntentGraph

# Create a new intent graph
graph = IntentGraph.create(
    owner='you@example.com',
    name='My 2024 Goals'
)

# Add a goal
goal = graph.add_goal(
    title='Launch AI product',
    priority={'level': 'critical'},
    deadline='2024-03-15',
    success_criteria=['Live on Product Hunt', '100 signups'],
    domain='work'
)

# Get top priorities
top_5 = graph.get_top_priorities(count=5)

# Save
graph.to_file('~/.goalos/my-goals.json')
```

## API Reference

### IntentGraph

Main class for working with intent graphs.

- `IntentGraph.create(owner, name)` - Create new graph
- `IntentGraph.from_file(path)` - Load from file
- `IntentGraph.from_json(json_str)` - Load from JSON string
- `IntentGraph.from_dict(dict_obj)` - Load from dictionary
- `add_goal(**kwargs)` - Add a goal
- `get_goal(goal_id)` - Get single goal
- `update_goal(goal_id, updates)` - Update goal
- `remove_goal(goal_id)` - Delete goal
- `complete_goal(goal_id)` - Mark complete
- `block_goal(goal_id, reason)` - Block goal
- `unblock_goal(goal_id)` - Unblock goal
- `get_by_status(status)` - Filter by status
- `get_by_priority(level)` - Filter by priority
- `get_by_domain(domain)` - Filter by domain
- `get_by_tag(tag)` - Filter by tag
- `get_top_priorities(count)` - Get top N goals
- `query(filter_dict)` - Complex query
- `add_dependency(goal_id, target_id, type)` - Add dependency
- `get_dependency_chain(goal_id)` - Get dependency chain
- `get_blockers(goal_id)` - Get blockers
- `validate()` - Validate graph
- `to_file(path)` - Save to file
- `to_json()` - Convert to JSON
- `to_dict()` - Convert to dictionary
- `get_stats()` - Get statistics

### Goal

Individual goal object with fields:

- `id` - Goal ID
- `title` - Goal title
- `description` - Optional description
- `status` - Status (active, planned, blocked, completed, abandoned)
- `priority` - Priority level
- `deadline` - ISO 8601 datetime
- `success_criteria` - List of criteria
- `tags` - List of tags
- `domain` - Domain (work, personal, health, creative)

## Examples

### Load and Query

```python
graph = IntentGraph.from_file('goals.json')
active = graph.get_by_status('active')
print(f"Active goals: {len(active)}")
```

### Update Progress

```python
graph.complete_goal('goal_id')
graph.to_file('goals.json')
```

### Get Statistics

```python
stats = graph.get_stats()
print(f"Completion: {stats.completion_rate:.1%}")
print(f"Total: {stats.total_goals}")
```
