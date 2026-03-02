"""
Goal class for managing individual goal objects
"""

from typing import Any, Dict, List, Optional
import json

from .types import (
    Goal,
    GoalStatus,
    Priority,
    Dependency,
    Permission,
    Duration,
)
from .utils import (
    generate_goal_id,
    get_current_timestamp,
    validate_goal_structure,
    deep_clone,
    is_overdue,
    days_until_deadline,
)


class GoalManager:
    """Manager for creating and manipulating goal objects"""

    @staticmethod
    def create(
        title: str,
        description: Optional[str] = None,
        parent_id: Optional[str] = None,
        status: Optional[GoalStatus] = None,
        priority: Optional[Priority] = None,
        success_criteria: Optional[List[str]] = None,
        deadline: Optional[str] = None,
        time_horizon: Optional[str] = None,
        estimated_effort: Optional[Duration] = None,
        motivation: Optional[str] = None,
        tags: Optional[List[str]] = None,
        domain: Optional[str] = None,
        dependencies: Optional[List[Dependency]] = None,
        permissions: Optional[List[Permission]] = None,
        created_by: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Goal:
        """Create a new goal with defaults"""
        now = get_current_timestamp()
        goal = Goal(
            id=generate_goal_id(),
            title=title,
            description=description,
            parentId=parent_id or None,
            status=status or "planned",
            priority=priority or Priority(level="medium"),
            successCriteria=success_criteria,
            deadline=deadline,
            timeHorizon=time_horizon,
            estimatedEffort=estimated_effort,
            motivation=motivation,
            tags=tags,
            domain=domain,
            dependencies=dependencies or [],
            permissions=permissions or [],
            createdAt=now,
            updatedAt=now,
            createdBy=created_by,
            version=1,
            metadata=metadata or {},
        )

        errors = validate_goal_structure(goal)
        if errors:
            raise ValueError(f"Invalid goal: {', '.join(errors)}")

        return goal

    @staticmethod
    def update(goal: Goal, updates: Dict[str, Any]) -> Goal:
        """Update a goal with new values"""
        updated_data = goal.model_dump()
        updated_data.update(updates)

        # Preserve immutable fields
        updated_data["id"] = goal.id
        updated_data["createdAt"] = goal.createdAt
        updated_data["updatedAt"] = get_current_timestamp()
        updated_data["version"] = goal.version + 1

        updated = Goal(**updated_data)

        errors = validate_goal_structure(updated)
        if errors:
            raise ValueError(f"Invalid goal update: {', '.join(errors)}")

        return updated

    @staticmethod
    def complete(goal: Goal, completed_by: Optional[str] = None) -> Goal:
        """Mark a goal as completed"""
        if goal.status == "completed":
            return goal

        return GoalManager.update(goal, {
            "status": "completed",
            "completedAt": get_current_timestamp(),
            "createdBy": completed_by or goal.createdBy,
        })

    @staticmethod
    def abandon(goal: Goal, reason: Optional[str] = None) -> Goal:
        """Mark a goal as abandoned"""
        if goal.status == "abandoned":
            return goal

        metadata = deep_clone(goal.metadata or {})
        if reason:
            metadata["abandonReason"] = reason

        return GoalManager.update(goal, {
            "status": "abandoned",
            "completedAt": get_current_timestamp(),
            "metadata": metadata,
        })

    @staticmethod
    def block(goal: Goal, blocked_by: Optional[str] = None) -> Goal:
        """Block a goal"""
        if goal.status == "blocked":
            return goal

        metadata = deep_clone(goal.metadata or {})
        if blocked_by:
            metadata["blockedBy"] = blocked_by

        return GoalManager.update(goal, {
            "status": "blocked",
            "metadata": metadata,
        })

    @staticmethod
    def unblock(goal: Goal) -> Goal:
        """Unblock a goal"""
        if goal.status != "blocked":
            return goal

        metadata = deep_clone(goal.metadata or {})
        if "blockedBy" in metadata:
            del metadata["blockedBy"]

        return GoalManager.update(goal, {
            "status": "active",
            "metadata": metadata,
        })

    @staticmethod
    def pause(goal: Goal) -> Goal:
        """Pause a goal"""
        if goal.status == "paused":
            return goal

        return GoalManager.update(goal, {"status": "paused"})

    @staticmethod
    def resume(goal: Goal) -> Goal:
        """Resume a paused goal"""
        if goal.status != "paused":
            return goal

        return GoalManager.update(goal, {"status": "active"})

    @staticmethod
    def add_dependency(goal: Goal, dependency: Dependency) -> Goal:
        """Add a dependency to a goal"""
        dependencies = deep_clone(goal.dependencies or [])
        if not any(
            d.targetGoalId == dependency.targetGoalId and d.type == dependency.type
            for d in dependencies
        ):
            dependencies.append(dependency)

        return GoalManager.update(goal, {"dependencies": dependencies})

    @staticmethod
    def remove_dependency(
        goal: Goal,
        target_goal_id: str,
        dep_type: Optional[str] = None
    ) -> Goal:
        """Remove a dependency from a goal"""
        dependencies = [
            d for d in (goal.dependencies or [])
            if not (d.targetGoalId == target_goal_id and (dep_type is None or d.type == dep_type))
        ]

        return GoalManager.update(goal, {"dependencies": dependencies})

    @staticmethod
    def add_permission(goal: Goal, permission: Permission) -> Goal:
        """Add a permission to a goal"""
        permissions = deep_clone(goal.permissions or [])
        existing_index = next(
            (i for i, p in enumerate(permissions) if p.agentId == permission.agentId),
            -1
        )

        if existing_index >= 0:
            permissions[existing_index] = permission
        else:
            permissions.append(permission)

        return GoalManager.update(goal, {"permissions": permissions})

    @staticmethod
    def remove_permission(goal: Goal, agent_id: str) -> Goal:
        """Remove a permission from a goal"""
        permissions = [p for p in (goal.permissions or []) if p.agentId != agent_id]
        return GoalManager.update(goal, {"permissions": permissions})

    @staticmethod
    def set_priority(goal: Goal, priority: Priority) -> Goal:
        """Update goal priority"""
        return GoalManager.update(goal, {"priority": priority})

    @staticmethod
    def is_overdue(goal: Goal) -> bool:
        """Check if goal is overdue"""
        return is_overdue(goal)

    @staticmethod
    def days_until_deadline(goal: Goal) -> Optional[int]:
        """Get days until goal deadline"""
        return days_until_deadline(goal)

    @staticmethod
    def is_complete(goal: Goal) -> bool:
        """Check if goal has all required fields filled"""
        return bool(
            goal.title
            and goal.status
            and goal.priority
            and goal.deadline
            and goal.successCriteria
            and len(goal.successCriteria) > 0
        )

    @staticmethod
    def to_json(goal: Goal) -> str:
        """Export goal to JSON string"""
        return json.dumps(goal.model_dump(), indent=2, default=str)

    @staticmethod
    def from_json(data: str | Dict[str, Any]) -> Goal:
        """Create goal from JSON"""
        if isinstance(data, str):
            data = json.loads(data)

        errors = validate_goal_structure(Goal(**data))
        if errors:
            raise ValueError(f"Invalid goal JSON: {', '.join(errors)}")

        return Goal(**data)
