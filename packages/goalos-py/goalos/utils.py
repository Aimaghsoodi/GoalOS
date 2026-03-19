"""
Utility functions for GoalOS
ID generation, timestamps, helpers
"""

import uuid
import string
from datetime import datetime, timezone
from typing import Any, Dict, List
import json
import re

from .types import Goal, GoalStatus, GoalFilter


def generate_goal_id() -> str:
    """Generate a unique goal ID in nanoid format: goal_<random>"""
    alphabet = string.ascii_letters + string.digits
    random_part = "".join(uuid.uuid4().hex[i % len(alphabet)] for i in range(8))
    return f"goal_{random_part}"


def generate_graph_id() -> str:
    """Generate a unique graph ID in nanoid format: graph_<random>"""
    alphabet = string.ascii_letters + string.digits
    random_part = "".join(uuid.uuid4().hex[i % len(alphabet)] for i in range(8))
    return f"graph_{random_part}"


def generate_event_id() -> str:
    """Generate a unique event ID"""
    return f"event_{int(datetime.now().timestamp() * 1000)}"


def get_current_timestamp() -> str:
    """Get current timestamp in ISO 8601 format"""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def deep_clone(obj: Any) -> Any:
    """Deep copy an object using JSON serialization"""
    if isinstance(obj, (str, int, float, bool, type(None))):
        return obj
    if hasattr(obj, "model_copy"):
        return obj.model_copy(deep=True)
    if isinstance(obj, dict):
        return {k: deep_clone(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [deep_clone(item) for item in obj]
    # For other Pydantic-like objects, fall back to a model dump.
    if hasattr(obj, "model_dump"):
        return deep_clone(obj.model_dump())
    return obj


def is_overdue(goal: Goal) -> bool:
    """Check if a goal is overdue"""
    if not goal.deadline:
        return False

    try:
        deadline = datetime.fromisoformat(goal.deadline.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        return deadline < now and goal.status not in ["completed", "abandoned"]
    except (ValueError, TypeError):
        return False


def days_until_deadline(goal: Goal) -> int | None:
    """Get number of days until deadline, or None if no deadline"""
    if not goal.deadline:
        return None

    try:
        deadline = datetime.fromisoformat(goal.deadline.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        delta = deadline - now
        return max(0, delta.days)
    except (ValueError, TypeError):
        return None


def validate_goal_structure(goal: Goal) -> List[str]:
    """Validate goal structure and return list of errors"""
    errors: List[str] = []

    # Check required fields
    if not goal.id:
        errors.append("Goal ID is required")
    if not goal.title:
        errors.append("Goal title is required")
    if not goal.status:
        errors.append("Goal status is required")
    if not goal.priority:
        errors.append("Goal priority is required")

    # Validate ID format
    if goal.id and not re.match(r"^goal_[a-zA-Z0-9]+$", goal.id):
        errors.append(f"Invalid goal ID format: {goal.id}")

    # Validate status
    valid_statuses = ["active", "planned", "blocked", "paused", "completed", "abandoned"]
    if goal.status and goal.status not in valid_statuses:
        errors.append(f"Invalid status: {goal.status}")

    # Validate priority
    valid_priorities = ["critical", "high", "medium", "low", "someday"]
    if goal.priority and goal.priority.level not in valid_priorities:
        errors.append(f"Invalid priority level: {goal.priority.level}")

    if goal.priority and goal.priority.score is not None:
        if goal.priority.score < 0 or goal.priority.score > 100:
            errors.append("Priority score must be between 0 and 100")

    # Validate timestamps
    if goal.createdAt:
        try:
            datetime.fromisoformat(goal.createdAt.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            errors.append(f"Invalid createdAt timestamp: {goal.createdAt}")

    if goal.updatedAt:
        try:
            datetime.fromisoformat(goal.updatedAt.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            errors.append(f"Invalid updatedAt timestamp: {goal.updatedAt}")

    if goal.deadline:
        try:
            datetime.fromisoformat(goal.deadline.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            errors.append(f"Invalid deadline: {goal.deadline}")

    return errors


def calculate_progress(goal: Goal, children: List[Goal]) -> float:
    """Calculate progress of a goal (0-1) based on children completion"""
    if not children:
        # No children, use goal status
        return 1.0 if goal.status == "completed" else 0.0

    completed = sum(1 for child in children if child.status == "completed")
    return completed / len(children) if children else 0.0


def build_goal_map(goals: List[Goal]) -> Dict[str, Goal]:
    """Build a map of goal ID to goal object for quick lookup"""
    return {goal.id: goal for goal in goals}


def match_filter_field(
    goal: Goal,
    filter_value: Any,
    field_name: str
) -> bool:
    """Match a goal against a single filter field"""
    if filter_value is None:
        return True

    goal_value = getattr(goal, field_name, None)

    # Handle list values
    if isinstance(filter_value, list):
        if field_name == "tags":
            # Must have all tags
            return all(tag in (goal.tags or []) for tag in filter_value)
        # For other lists, any match
        return goal_value in filter_value if not isinstance(goal_value, list) else any(
            v in filter_value for v in goal_value
        )

    # Handle single values
    return goal_value == filter_value


def matches_search(goal: Goal, search_query: str) -> bool:
    """Check if a goal matches a search query"""
    query_lower = search_query.lower()
    title_match = query_lower in goal.title.lower() if goal.title else False
    desc_match = query_lower in goal.description.lower() if goal.description else False
    return title_match or desc_match
