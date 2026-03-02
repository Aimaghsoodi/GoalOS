"""
IntentGraph - Core data structure for managing goals and relationships
"""

import json
from typing import Any, Dict, List, Optional
from pathlib import Path

from .types import (
    Goal,
    IntentGraph,
    GoalStatus,
    Priority,
    Dependency,
    Permission,
    GoalFilter,
    GoalTreeNode,
    MergeResult,
    MergeStrategy,
    ValidationResult,
    GraphStats,
)
from .goal import GoalManager
from .priority import PriorityEngine
from .permissions import PermissionManager
from .serialization import Serializer
from .validation import Validator
from .query import QueryEngine
from .utils import (
    generate_graph_id,
    get_current_timestamp,
    deep_clone,
    calculate_progress,
    build_goal_map,
)


class IntentGraphManager:
    """Manager for IntentGraph - the core data structure"""

    @staticmethod
    def create(owner: str, name: Optional[str] = None) -> "IntentGraphClient":
        """Create a new empty intent graph"""
        now = get_current_timestamp()
        graph = IntentGraph(
            id=generate_graph_id(),
            version="0.1.0",
            owner=owner,
            name=name,
            goals=[],
            defaultPermissions=[],
            createdAt=now,
            updatedAt=now,
            metadata={},
        )
        return IntentGraphClient(graph)

    @staticmethod
    def from_json(data: str | Dict[str, Any]) -> "IntentGraphClient":
        """Create from JSON object"""
        if isinstance(data, str):
            data = json.loads(data)
        graph = IntentGraph(**data)
        return IntentGraphClient(graph)

    @staticmethod
    async def from_file(path: str | Path) -> "IntentGraphClient":
        """Create from JSON file"""
        file_path = Path(path)
        with open(file_path, "r") as f:
            data = json.load(f)
        return IntentGraphManager.from_json(data)


class IntentGraphClient:
    """Client for managing an intent graph"""

    def __init__(self, graph: IntentGraph):
        """Initialize with a graph"""
        self.graph = deep_clone(graph)
        self.validator = Validator()

    # === Goal CRUD ===

    def add_goal(
        self,
        title: str,
        description: Optional[str] = None,
        parent_id: Optional[str] = None,
        priority: Optional[Priority] = None,
        domain: Optional[str] = None,
        deadline: Optional[str] = None,
        time_horizon: Optional[str] = None,
        success_criteria: Optional[List[str]] = None,
        motivation: Optional[str] = None,
        tags: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> Goal:
        """Add a new goal"""
        goal = GoalManager.create(
            title=title,
            description=description,
            parent_id=parent_id,
            priority=priority or Priority(level="medium"),
            domain=domain,
            deadline=deadline,
            time_horizon=time_horizon,
            success_criteria=success_criteria,
            motivation=motivation,
            tags=tags,
            **kwargs,
        )
        self.graph.goals.append(goal)
        self.graph.updatedAt = get_current_timestamp()
        return goal

    def update_goal(self, goal_id: str, updates: Dict[str, Any]) -> Goal:
        """Update a goal"""
        goal = self.get_goal(goal_id)
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        updated = GoalManager.update(goal, updates)
        index = next(i for i, g in enumerate(self.graph.goals) if g.id == goal_id)
        self.graph.goals[index] = updated
        self.graph.updatedAt = get_current_timestamp()
        return updated

    def remove_goal(self, goal_id: str, remove_children: bool = False) -> None:
        """Remove a goal"""
        index = next(
            (i for i, g in enumerate(self.graph.goals) if g.id == goal_id),
            -1
        )
        if index == -1:
            raise ValueError(f"Goal {goal_id} not found")

        if remove_children:
            children_ids = [g.id for g in self.get_children(goal_id)]
            for child_id in children_ids:
                self.remove_goal(child_id, remove_children=True)

        self.graph.goals.pop(index)
        self.graph.updatedAt = get_current_timestamp()

    def get_goal(self, goal_id: str) -> Optional[Goal]:
        """Get a goal by ID"""
        return next((g for g in self.graph.goals if g.id == goal_id), None)

    # === Status transitions ===

    def complete_goal(self, goal_id: str, completed_by: Optional[str] = None) -> Goal:
        """Mark goal as completed"""
        goal = self.get_goal(goal_id)
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        completed = GoalManager.complete(goal, completed_by)
        return self.update_goal(goal_id, completed.model_dump())

    def abandon_goal(self, goal_id: str, reason: Optional[str] = None) -> Goal:
        """Mark goal as abandoned"""
        goal = self.get_goal(goal_id)
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        abandoned = GoalManager.abandon(goal, reason)
        return self.update_goal(goal_id, abandoned.model_dump())

    def block_goal(self, goal_id: str, blocked_by: Optional[str] = None) -> Goal:
        """Block a goal"""
        goal = self.get_goal(goal_id)
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        blocked = GoalManager.block(goal, blocked_by)
        return self.update_goal(goal_id, blocked.model_dump())

    def unblock_goal(self, goal_id: str) -> Goal:
        """Unblock a goal"""
        goal = self.get_goal(goal_id)
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        unblocked = GoalManager.unblock(goal)
        return self.update_goal(goal_id, unblocked.model_dump())

    # === Dependencies ===

    def add_dependency(self, goal_id: str, dependency: Dependency) -> None:
        """Add dependency"""
        if self._would_create_cycle(goal_id, dependency.targetGoalId):
            raise ValueError(
                f"Adding this dependency would create a cycle: {goal_id} -> {dependency.targetGoalId}"
            )

        goal = self.get_goal(goal_id)
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        updated = GoalManager.add_dependency(goal, dependency)
        self.update_goal(goal_id, updated.model_dump())

    def remove_dependency(
        self,
        goal_id: str,
        target_goal_id: str,
        dep_type: Optional[str] = None
    ) -> None:
        """Remove dependency"""
        goal = self.get_goal(goal_id)
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        updated = GoalManager.remove_dependency(goal, target_goal_id, dep_type)
        self.update_goal(goal_id, updated.model_dump())

    def get_dependency_chain(self, goal_id: str) -> List[Goal]:
        """Get dependency chain for a goal"""
        goal = self.get_goal(goal_id)
        if not goal:
            return []

        chain: List[Goal] = []
        visited = set()

        def traverse(g: Goal) -> None:
            if g.id in visited:
                return
            visited.add(g.id)
            chain.append(g)
            if g.dependencies:
                for dep in g.dependencies:
                    target = self.get_goal(dep.targetGoalId)
                    if target:
                        traverse(target)

        traverse(goal)
        return chain

    def get_blockers(self, goal_id: str) -> List[Goal]:
        """Get goals blocking this one"""
        goal = self.get_goal(goal_id)
        if not goal:
            return []

        blockers = []
        for other in self.graph.goals:
            if other.dependencies:
                for dep in other.dependencies:
                    if dep.targetGoalId == goal_id:
                        blockers.append(other)
        return blockers

    def get_unblocked_goals(self) -> List[Goal]:
        """Get goals that are not blocked by dependencies"""
        all_blocked_ids = set()
        for goal in self.graph.goals:
            if goal.dependencies:
                for dep in goal.dependencies:
                    all_blocked_ids.add(goal.id)

        return [g for g in self.graph.goals if g.id not in all_blocked_ids]

    def detect_cycles(self) -> Optional[List[List[str]]]:
        """Detect cycles in dependencies"""
        return self.validator.check_cycles(self.graph.goals)

    # === Queries ===

    def get_top_priorities(self, count: int = 5) -> List[Goal]:
        """Get top priority goals"""
        return PriorityEngine.get_top_priorities(self.graph.goals, count)

    def get_by_status(self, status: GoalStatus | List[GoalStatus]) -> List[Goal]:
        """Get goals by status"""
        return QueryEngine.by_status(self.graph.goals, status)

    def get_by_domain(self, domain: str) -> List[Goal]:
        """Get goals by domain"""
        return QueryEngine.by_domain(self.graph.goals, domain)

    def get_by_time_horizon(self, horizon: str) -> List[Goal]:
        """Get goals by time horizon"""
        return QueryEngine.by_time_horizon(self.graph.goals, horizon)

    def get_by_tag(self, tag: str) -> List[Goal]:
        """Get goals by tag"""
        return QueryEngine.by_tag(self.graph.goals, tag)

    def get_children(self, goal_id: str) -> List[Goal]:
        """Get child goals"""
        return QueryEngine.children(self.graph.goals, goal_id)

    def get_descendants(self, goal_id: str) -> List[Goal]:
        """Get descendant goals"""
        return QueryEngine.descendants(self.graph.goals, goal_id)

    def get_root_goals(self) -> List[Goal]:
        """Get root goals"""
        return QueryEngine.roots(self.graph.goals)

    def query(self, filter_obj: GoalFilter) -> List[Goal]:
        """Query goals with filter"""
        return QueryEngine.query(self.graph.goals, filter_obj).goals

    # === Permissions ===

    def grant_permission(self, agent_id: str, permission: Permission) -> None:
        """Grant permission"""
        if not self.graph.defaultPermissions:
            self.graph.defaultPermissions = []

        index = next(
            (i for i, p in enumerate(self.graph.defaultPermissions) if p.agentId == agent_id),
            -1
        )
        if index >= 0:
            self.graph.defaultPermissions[index] = permission
        else:
            self.graph.defaultPermissions.append(permission)

        self.graph.updatedAt = get_current_timestamp()

    def revoke_permission(self, agent_id: str) -> None:
        """Revoke permission"""
        if self.graph.defaultPermissions:
            self.graph.defaultPermissions = [
                p for p in self.graph.defaultPermissions if p.agentId != agent_id
            ]
        self.graph.updatedAt = get_current_timestamp()

    def get_permissions(self, agent_id: str) -> Optional[Permission]:
        """Get permissions for agent"""
        return PermissionManager.get_agent_permissions(
            agent_id, self.graph.defaultPermissions
        )

    def check_permission(self, agent_id: str, capability: str, goal_id: str) -> bool:
        """Check if agent has capability"""
        goal = self.get_goal(goal_id)
        if not goal:
            return False

        perms = [
            *(self.graph.defaultPermissions or []),
            *(goal.permissions or [])
        ]
        return PermissionManager.has_capability(agent_id, capability, goal, perms)

    # === Tree ===

    def get_tree(self) -> List[GoalTreeNode]:
        """Get goal tree"""
        roots = self.get_root_goals()
        return [self.get_subtree(root.id) for root in roots]

    def get_subtree(self, goal_id: str) -> GoalTreeNode:
        """Get subtree for goal"""
        goal = self.get_goal(goal_id)
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        children = self.get_children(goal_id)
        child_nodes = [self.get_subtree(child.id) for child in children]

        return GoalTreeNode(
            goal=goal,
            children=child_nodes,
            depth=self._calculate_depth(goal_id),
            progress=calculate_progress(goal, children),
        )

    def move_goal(self, goal_id: str, new_parent_id: Optional[str]) -> None:
        """Move goal under new parent"""
        goal = self.get_goal(goal_id)
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        if new_parent_id:
            parent = self.get_goal(new_parent_id)
            if not parent:
                raise ValueError(f"Parent goal {new_parent_id} not found")

        self.update_goal(goal_id, {"parentId": new_parent_id})

    # === Serialization ===

    def to_json(self) -> IntentGraph:
        """Convert to JSON object"""
        return deep_clone(self.graph)

    def to_json_str(self) -> str:
        """Convert to JSON string"""
        return Serializer.graph_to_json(self.graph)

    def to_jsonld(self) -> Dict[str, Any]:
        """Convert to JSON-LD"""
        return Serializer.graph_to_jsonld(self.graph)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return Serializer.graph_to_dict(self.graph)

    async def to_file(self, path: str | Path) -> None:
        """Save to JSON file"""
        file_path = Path(path)
        file_path.write_text(self.to_json_str())

    # === Validation ===

    def validate(self) -> ValidationResult:
        """Validate the graph"""
        return self.validator.validate_graph(self.graph)

    # === Stats ===

    def get_stats(self) -> GraphStats:
        """Get graph statistics"""
        return GraphStats(
            totalGoals=len(self.graph.goals),
            byStatus=QueryEngine.count_by_status(self.graph.goals),
            byPriority=QueryEngine.count_by_priority(self.graph.goals),
            byDomain=QueryEngine.count_by_domain(self.graph.goals),
            completionRate=self.get_completion_rate(),
            averageDepth=self._get_average_depth(),
            orphanedGoals=self._get_orphaned_count(),
        )

    def get_completion_rate(self) -> float:
        """Get completion rate"""
        if not self.graph.goals:
            return 0.0
        completed = sum(1 for g in self.graph.goals if g.status == "completed")
        return completed / len(self.graph.goals)

    def get_progress(self, goal_id: str) -> float:
        """Get progress of a goal"""
        goal = self.get_goal(goal_id)
        if not goal:
            return 0.0

        children = self.get_children(goal_id)
        return calculate_progress(goal, children)

    # === Private helpers ===

    def _calculate_depth(self, goal_id: str) -> int:
        """Calculate depth of a goal"""
        goal = self.get_goal(goal_id)
        if not goal or not goal.parentId:
            return 0

        depth = 0
        current = goal
        while current.parentId:
            depth += 1
            current = self.get_goal(current.parentId)
            if not current:
                break

        return depth

    def _get_average_depth(self) -> float:
        """Get average depth"""
        if not self.graph.goals:
            return 0.0
        depths = [self._calculate_depth(g.id) for g in self.graph.goals]
        return sum(depths) / len(depths)

    def _get_orphaned_count(self) -> int:
        """Get count of orphaned goals"""
        goal_ids = {g.id for g in self.graph.goals}
        return sum(
            1 for g in self.graph.goals
            if g.parentId and g.parentId not in goal_ids
        )

    def _would_create_cycle(self, goal_id: str, target_id: str) -> bool:
        """Check if adding dependency would create cycle"""
        # Check if target depends on goal (directly or indirectly)
        chain = self.get_dependency_chain(target_id)
        return any(g.id == goal_id for g in chain)
