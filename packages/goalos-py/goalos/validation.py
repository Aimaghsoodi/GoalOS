"""
Schema validation for goals and intent graphs
"""

from datetime import datetime
from typing import List
import re

from .types import Goal, IntentGraph, ValidationResult, ValidationError, ValidationWarning
from .utils import validate_goal_structure, build_goal_map


class Validator:
    """Validator for goals and intent graphs"""

    @staticmethod
    def validate_goal(goal: Goal) -> ValidationResult:
        """Validate a goal object"""
        errors: List[ValidationError] = []
        warnings: List[ValidationWarning] = []

        # Basic structural validation
        structure_errors = validate_goal_structure(goal)
        errors.extend([
            ValidationError(message=msg, path="goal")
            for msg in structure_errors
        ])

        # Title validation
        if not goal.title or goal.title.strip() == "":
            errors.append(ValidationError(
                message="Title is required and cannot be empty",
                path="title"
            ))
        elif len(goal.title) > 500:
            warnings.append(ValidationWarning(
                message="Title is very long (>500 chars)",
                path="title"
            ))

        # Status validation
        valid_statuses = ["active", "planned", "blocked", "paused", "completed", "abandoned"]
        if goal.status not in valid_statuses:
            errors.append(ValidationError(
                message=f"Invalid status: {goal.status}",
                path="status"
            ))

        # Priority validation
        valid_priorities = ["critical", "high", "medium", "low", "someday"]
        if goal.priority.level not in valid_priorities:
            errors.append(ValidationError(
                message=f"Invalid priority level: {goal.priority.level}",
                path="priority.level"
            ))

        if goal.priority.score is not None:
            if goal.priority.score < 0 or goal.priority.score > 100:
                errors.append(ValidationError(
                    message="Priority score must be between 0 and 100",
                    path="priority.score"
                ))

        # Deadline validation
        if goal.deadline:
            try:
                deadline = datetime.fromisoformat(goal.deadline.replace("Z", "+00:00"))
                if deadline < datetime.utcnow() and goal.status not in ["completed", "abandoned"]:
                    warnings.append(ValidationWarning(
                        message="Goal deadline is in the past",
                        path="deadline"
                    ))
            except (ValueError, TypeError):
                errors.append(ValidationError(
                    message="Invalid deadline format",
                    path="deadline"
                ))

        # Timestamps validation
        for ts_field in ["createdAt", "updatedAt", "completedAt"]:
            ts_value = getattr(goal, ts_field, None)
            if ts_value:
                try:
                    datetime.fromisoformat(ts_value.replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    errors.append(ValidationError(
                        message=f"Invalid {ts_field} format",
                        path=ts_field
                    ))

        # Success criteria validation
        if goal.successCriteria:
            if not isinstance(goal.successCriteria, list):
                errors.append(ValidationError(
                    message="Success criteria must be a list",
                    path="successCriteria"
                ))
            elif len(goal.successCriteria) == 0:
                warnings.append(ValidationWarning(
                    message="Success criteria list is empty",
                    path="successCriteria"
                ))

        # Dependencies validation
        if goal.dependencies:
            valid_types = ["blocks", "requires", "enables", "related"]
            for i, dep in enumerate(goal.dependencies):
                if dep.type not in valid_types:
                    errors.append(ValidationError(
                        message=f"Invalid dependency type: {dep.type}",
                        path=f"dependencies[{i}].type"
                    ))
                if not dep.targetGoalId:
                    errors.append(ValidationError(
                        message="Dependency targetGoalId is required",
                        path=f"dependencies[{i}].targetGoalId"
                    ))

        # Permissions validation
        if goal.permissions:
            valid_caps = ["read", "write", "complete", "create_sub_goals", "reprioritize"]
            for i, perm in enumerate(goal.permissions):
                if not perm.agentId:
                    errors.append(ValidationError(
                        message="Permission agentId is required",
                        path=f"permissions[{i}].agentId"
                    ))
                for j, cap in enumerate(perm.capabilities):
                    if cap not in valid_caps:
                        errors.append(ValidationError(
                            message=f"Invalid capability: {cap}",
                            path=f"permissions[{i}].capabilities[{j}]"
                        ))

        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )

    @staticmethod
    def validate_graph(graph: IntentGraph) -> ValidationResult:
        """Validate an intent graph"""
        errors: List[ValidationError] = []
        warnings: List[ValidationWarning] = []

        # Graph-level validation
        if not graph.id:
            errors.append(ValidationError(
                message="Graph ID is required",
                path="id"
            ))
        elif not re.match(r"^graph_[a-zA-Z0-9]+$", graph.id):
            errors.append(ValidationError(
                message=f"Invalid graph ID format: {graph.id}",
                path="id"
            ))

        if not graph.owner:
            errors.append(ValidationError(
                message="Graph owner is required",
                path="owner"
            ))

        # Validate all goals
        goal_map = build_goal_map(graph.goals)
        for goal in graph.goals:
            goal_result = Validator.validate_goal(goal)
            errors.extend([
                ValidationError(
                    message=e.message,
                    path=f"goals[{goal.id}].{e.path}" if e.path else f"goals[{goal.id}]",
                    data=e.data
                )
                for e in goal_result.errors
            ])
            warnings.extend([
                ValidationWarning(
                    message=w.message,
                    path=f"goals[{goal.id}].{w.path}" if w.path else f"goals[{goal.id}]",
                    data=w.data
                )
                for w in goal_result.warnings
            ])

        # Check referential integrity
        for goal in graph.goals:
            # Check parent exists
            if goal.parentId and goal.parentId not in goal_map:
                errors.append(ValidationError(
                    message=f"Parent goal {goal.parentId} not found",
                    path=f"goals[{goal.id}].parentId"
                ))

            # Check dependencies exist
            if goal.dependencies:
                for dep in goal.dependencies:
                    if dep.targetGoalId not in goal_map:
                        errors.append(ValidationError(
                            message=f"Dependency target {dep.targetGoalId} not found",
                            path=f"goals[{goal.id}].dependencies"
                        ))

        # Timestamps validation
        if graph.createdAt:
            try:
                datetime.fromisoformat(graph.createdAt.replace("Z", "+00:00"))
            except (ValueError, TypeError):
                errors.append(ValidationError(
                    message="Invalid createdAt timestamp",
                    path="createdAt"
                ))

        if graph.updatedAt:
            try:
                datetime.fromisoformat(graph.updatedAt.replace("Z", "+00:00"))
            except (ValueError, TypeError):
                errors.append(ValidationError(
                    message="Invalid updatedAt timestamp",
                    path="updatedAt"
                ))

        return ValidationResult(
            valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )

    @staticmethod
    def check_cycles(goals: List[Goal]) -> List[List[str]] | None:
        """Detect cycles in goal dependencies"""
        goal_map = build_goal_map(goals)
        visited = set()
        rec_stack = set()
        cycles: List[List[str]] = []

        def dfs(goal_id: str, path: List[str]) -> None:
            visited.add(goal_id)
            rec_stack.add(goal_id)
            path.append(goal_id)

            goal = goal_map.get(goal_id)
            if goal and goal.dependencies:
                for dep in goal.dependencies:
                    target_id = dep.targetGoalId
                    if target_id not in visited:
                        dfs(target_id, path.copy())
                    elif target_id in rec_stack:
                        # Found a cycle
                        cycle_start = path.index(target_id)
                        cycle = path[cycle_start:] + [target_id]
                        cycles.append(cycle)

            rec_stack.remove(goal_id)

        for goal in goals:
            if goal.id not in visited:
                dfs(goal.id, [])

        return cycles if cycles else None
