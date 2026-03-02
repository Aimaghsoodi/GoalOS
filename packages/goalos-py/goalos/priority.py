"""
Priority calculation and ranking engine
"""

from typing import List, Dict
from .types import Goal, PriorityLevel, Priority


class PriorityEngine:
    """Priority calculation and goal ranking"""

    # Priority level scores (higher = more urgent)
    PRIORITY_SCORES = {
        "critical": 100,
        "high": 75,
        "medium": 50,
        "low": 25,
        "someday": 5,
    }

    @staticmethod
    def get_top_priorities(goals: List[Goal], count: int = 5) -> List[Goal]:
        """Get the top N priority goals"""
        # Filter to active/planned goals
        active_goals = [
            g for g in goals
            if g.status in ["active", "planned", "blocked"]
        ]

        # Sort by priority score
        sorted_goals = sorted(
            active_goals,
            key=lambda g: PriorityEngine._calculate_score(g),
            reverse=True
        )

        return sorted_goals[:count]

    @staticmethod
    def _calculate_score(goal: Goal) -> float:
        """Calculate priority score for a goal (0-100+)"""
        base_score = PriorityEngine.PRIORITY_SCORES.get(
            goal.priority.level, 50
        )

        # Use explicit score if provided
        if goal.priority.score is not None:
            return goal.priority.score

        score = float(base_score)

        # Adjust for overdue goals
        from .utils import is_overdue
        if is_overdue(goal):
            score += 20

        # Adjust for blocked status
        if goal.status == "blocked":
            score -= 10

        return max(0, score)

    @staticmethod
    def rank_goals(goals: List[Goal]) -> List[Goal]:
        """Rank all goals by priority"""
        return sorted(
            goals,
            key=lambda g: PriorityEngine._calculate_score(g),
            reverse=True
        )

    @staticmethod
    def group_by_priority(goals: List[Goal]) -> Dict[PriorityLevel, List[Goal]]:
        """Group goals by priority level"""
        grouped: Dict[PriorityLevel, List[Goal]] = {
            "critical": [],
            "high": [],
            "medium": [],
            "low": [],
            "someday": [],
        }

        for goal in goals:
            level: PriorityLevel = goal.priority.level
            grouped[level].append(goal)

        return grouped

    @staticmethod
    def update_score(priority: Priority, new_score: int) -> Priority:
        """Update the numeric score of a priority"""
        if new_score < 0 or new_score > 100:
            raise ValueError("Priority score must be between 0 and 100")

        return Priority(
            level=priority.level,
            score=new_score,
            reason=priority.reason
        )

    @staticmethod
    def set_level(priority: Priority, level: PriorityLevel) -> Priority:
        """Change the priority level"""
        return Priority(
            level=level,
            score=priority.score,
            reason=priority.reason
        )

    @staticmethod
    def set_reason(priority: Priority, reason: str) -> Priority:
        """Set the reason for priority"""
        return Priority(
            level=priority.level,
            score=priority.score,
            reason=reason
        )
