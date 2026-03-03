"""
Serialization for JSON and JSON-LD formats
"""

import json
from typing import Any, Dict

from .types import Goal, IntentGraph


class Serializer:
    """Serialization utilities for goals and graphs"""

    @staticmethod
    def goal_to_json(goal: Goal) -> str:
        """Convert goal to JSON string"""
        return json.dumps(goal.model_dump(mode="python"), indent=2, default=str)

    @staticmethod
    def goal_from_json(data: str | Dict[str, Any]) -> Goal:
        """Create goal from JSON"""
        if isinstance(data, str):
            data = json.loads(data)
        return Goal(**data)

    @staticmethod
    def goal_to_dict(goal: Goal) -> Dict[str, Any]:
        """Convert goal to dictionary"""
        return goal.model_dump(mode="python")

    @staticmethod
    def goal_to_jsonld(goal: Goal) -> Dict[str, Any]:
        """Convert goal to JSON-LD format"""
        data = goal.model_dump(mode="python")
        return {
            "@context": "https://github.com/Aimaghsoodi/GoalOS/context.jsonld",
            "@id": f"urn:goalos:goal:{goal.id}",
            "@type": "GoalOS:Goal",
            **data,
        }

    @staticmethod
    def graph_to_json(graph: IntentGraph) -> str:
        """Convert intent graph to JSON string"""
        return json.dumps(graph.model_dump(mode="python"), indent=2, default=str)

    @staticmethod
    def graph_from_json(data: str | Dict[str, Any]) -> IntentGraph:
        """Create intent graph from JSON"""
        if isinstance(data, str):
            data = json.loads(data)
        return IntentGraph(**data)

    @staticmethod
    def graph_to_dict(graph: IntentGraph) -> Dict[str, Any]:
        """Convert intent graph to dictionary"""
        return graph.model_dump(mode="python")

    @staticmethod
    def graph_to_jsonld(graph: IntentGraph) -> Dict[str, Any]:
        """Convert intent graph to JSON-LD format"""
        data = graph.model_dump(mode="python")
        goals_jsonld = [Serializer.goal_to_jsonld(goal) for goal in graph.goals]

        return {
            "@context": "https://github.com/Aimaghsoodi/GoalOS/context.jsonld",
            "@id": f"urn:goalos:graph:{graph.id}",
            "@type": "GoalOS:IntentGraph",
            "@graph": goals_jsonld,
            **{k: v for k, v in data.items() if k != "goals"},
        }

    @staticmethod
    def compact_goal(goal: Goal) -> Dict[str, Any]:
        """Create a compact representation of a goal"""
        return {
            "id": goal.id,
            "title": goal.title,
            "status": goal.status,
            "priority": goal.priority.level,
            "deadline": goal.deadline,
        }

    @staticmethod
    def expand_from_compact(data: Dict[str, Any]) -> Dict[str, Any]:
        """Expand compact goal data back to full format"""
        # This would require a full schema reference
        # For now, just return the data as-is
        return data
