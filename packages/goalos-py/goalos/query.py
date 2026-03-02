"""
Query and filtering engine for goals
"""

import time
from typing import List, Dict, Union
from datetime import datetime

from .types import Goal, GoalStatus, PriorityLevel, TimeHorizon, GoalFilter, QueryResult
from .utils import matches_search, build_goal_map


class QueryEngine:
    """Query and filter goals"""

    @staticmethod
    def by_status(goals: List[Goal], status: Union[GoalStatus, List[GoalStatus]]) -> List[Goal]:
        """Filter goals by status"""
        statuses = [status] if isinstance(status, str) else status
        return [g for g in goals if g.status in statuses]

    @staticmethod
    def by_priority(goals: List[Goal], priority: Union[PriorityLevel, List[PriorityLevel]]) -> List[Goal]:
        """Filter goals by priority level"""
        priorities = [priority] if isinstance(priority, str) else priority
        return [g for g in goals if g.priority.level in priorities]

    @staticmethod
    def by_domain(goals: List[Goal], domain: str) -> List[Goal]:
        """Filter goals by domain"""
        return [g for g in goals if g.domain == domain]

    @staticmethod
    def by_domains(goals: List[Goal], domains: List[str]) -> List[Goal]:
        """Filter goals by multiple domains"""
        return [g for g in goals if g.domain in domains]

    @staticmethod
    def by_time_horizon(goals: List[Goal], horizon: TimeHorizon) -> List[Goal]:
        """Filter goals by time horizon"""
        return [g for g in goals if g.timeHorizon == horizon]

    @staticmethod
    def by_tag(goals: List[Goal], tag: str) -> List[Goal]:
        """Filter goals by tag"""
        return [g for g in goals if tag in (g.tags or [])]

    @staticmethod
    def by_tags(goals: List[Goal], tags: List[str]) -> List[Goal]:
        """Filter goals by multiple tags (must have all)"""
        return [g for g in goals if all(tag in (g.tags or []) for tag in tags)]

    @staticmethod
    def children(goals: List[Goal], parent_id: str) -> List[Goal]:
        """Get direct children of a goal"""
        return [g for g in goals if g.parentId == parent_id]

    @staticmethod
    def descendants(goals: List[Goal], goal_id: str) -> List[Goal]:
        """Get all descendants of a goal"""
        children = QueryEngine.children(goals, goal_id)
        all_descendants = list(children)

        for child in children:
            all_descendants.extend(QueryEngine.descendants(goals, child.id))

        return all_descendants

    @staticmethod
    def roots(goals: List[Goal]) -> List[Goal]:
        """Get root goals (no parent)"""
        return [g for g in goals if not g.parentId]

    @staticmethod
    def with_deadline(goals: List[Goal]) -> List[Goal]:
        """Filter goals that have a deadline"""
        return [g for g in goals if g.deadline]

    @staticmethod
    def overdue(goals: List[Goal]) -> List[Goal]:
        """Filter overdue goals"""
        from .utils import is_overdue
        return [g for g in goals if is_overdue(g)]

    @staticmethod
    def before_deadline(goals: List[Goal], deadline: str) -> List[Goal]:
        """Filter goals with deadline before a specific date"""
        try:
            cutoff = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
            result = []
            for g in goals:
                if g.deadline:
                    goal_deadline = datetime.fromisoformat(g.deadline.replace("Z", "+00:00"))
                    if goal_deadline <= cutoff:
                        result.append(g)
            return result
        except (ValueError, TypeError):
            return []

    @staticmethod
    def after_deadline(goals: List[Goal], deadline: str) -> List[Goal]:
        """Filter goals with deadline after a specific date"""
        try:
            cutoff = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
            result = []
            for g in goals:
                if g.deadline:
                    goal_deadline = datetime.fromisoformat(g.deadline.replace("Z", "+00:00"))
                    if goal_deadline >= cutoff:
                        result.append(g)
            return result
        except (ValueError, TypeError):
            return []

    @staticmethod
    def created_before(goals: List[Goal], date: str) -> List[Goal]:
        """Filter goals created before a specific date"""
        try:
            cutoff = datetime.fromisoformat(date.replace("Z", "+00:00"))
            result = []
            for g in goals:
                created = datetime.fromisoformat(g.createdAt.replace("Z", "+00:00"))
                if created <= cutoff:
                    result.append(g)
            return result
        except (ValueError, TypeError):
            return []

    @staticmethod
    def created_after(goals: List[Goal], date: str) -> List[Goal]:
        """Filter goals created after a specific date"""
        try:
            cutoff = datetime.fromisoformat(date.replace("Z", "+00:00"))
            result = []
            for g in goals:
                created = datetime.fromisoformat(g.createdAt.replace("Z", "+00:00"))
                if created >= cutoff:
                    result.append(g)
            return result
        except (ValueError, TypeError):
            return []

    @staticmethod
    def search(goals: List[Goal], query: str) -> List[Goal]:
        """Full-text search goals"""
        return [g for g in goals if matches_search(g, query)]

    @staticmethod
    def query(goals: List[Goal], filter_obj: GoalFilter) -> QueryResult:
        """Execute a complex query with filters"""
        start_time = time.perf_counter()
        result = list(goals)

        # Apply filters
        if filter_obj.status:
            result = QueryEngine.by_status(result, filter_obj.status)

        if filter_obj.priority:
            result = QueryEngine.by_priority(result, filter_obj.priority)

        if filter_obj.domain:
            if isinstance(filter_obj.domain, str):
                result = QueryEngine.by_domain(result, filter_obj.domain)
            else:
                result = QueryEngine.by_domains(result, filter_obj.domain)

        if filter_obj.tags:
            result = QueryEngine.by_tags(result, filter_obj.tags)

        if filter_obj.timeHorizon:
            result = QueryEngine.by_time_horizon(result, filter_obj.timeHorizon)

        if filter_obj.parentId:
            result = QueryEngine.children(result, filter_obj.parentId)

        if filter_obj.hasDeadline:
            result = QueryEngine.with_deadline(result)

        if filter_obj.deadlineBefore:
            result = QueryEngine.before_deadline(result, filter_obj.deadlineBefore)

        if filter_obj.deadlineAfter:
            result = QueryEngine.after_deadline(result, filter_obj.deadlineAfter)

        if filter_obj.createdBefore:
            result = QueryEngine.created_before(result, filter_obj.createdBefore)

        if filter_obj.createdAfter:
            result = QueryEngine.created_after(result, filter_obj.createdAfter)

        if filter_obj.search:
            result = QueryEngine.search(result, filter_obj.search)

        execution_time = int((time.perf_counter() - start_time) * 1000)

        return QueryResult(
            goals=result,
            total=len(result),
            executionTime=execution_time,
        )

    @staticmethod
    def count_by_status(goals: List[Goal]) -> Dict[GoalStatus, int]:
        """Count goals by status"""
        counts: Dict[GoalStatus, int] = {}
        for goal in goals:
            counts[goal.status] = counts.get(goal.status, 0) + 1
        return counts

    @staticmethod
    def count_by_priority(goals: List[Goal]) -> Dict[PriorityLevel, int]:
        """Count goals by priority"""
        counts: Dict[PriorityLevel, int] = {}
        for goal in goals:
            level = goal.priority.level
            counts[level] = counts.get(level, 0) + 1
        return counts

    @staticmethod
    def count_by_domain(goals: List[Goal]) -> Dict[str, int]:
        """Count goals by domain"""
        counts: Dict[str, int] = {}
        for goal in goals:
            if goal.domain:
                counts[goal.domain] = counts.get(goal.domain, 0) + 1
        return counts
