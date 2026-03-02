"""
GoalOS LangChain Integration

This module provides a toolkit for integrating GoalOS intent graphs
with LangChain agents. It exposes goal data as tools that agents can
use for decision-making.
"""

from typing import Optional, List, Any
from langchain.tools import Tool
from goalos import IntentGraph, GoalStatus, PriorityLevel


class GoalOSToolkit:
    """
    A toolkit that wraps a GoalOS IntentGraph and exposes its data
    as LangChain tools.
    
    Usage:
        toolkit = GoalOSToolkit(graph_path="~/.goalos/graph.json")
        tools = toolkit.get_tools()
        agent = initialize_agent(tools, llm, ...)
    """
    
    def __init__(
        self,
        graph_path: Optional[str] = None,
        graph_data: Optional[dict] = None
    ):
        """
        Initialize the toolkit with either a file path or graph data.
        
        Args:
            graph_path: Path to intent graph JSON file
            graph_data: Pre-loaded graph data dictionary
        """
        if graph_path:
            self.graph = IntentGraph.from_file(graph_path)
        elif graph_data:
            self.graph = IntentGraph.from_json(graph_data)
        else:
            # Default to ~/.goalos/graph.json
            self.graph = IntentGraph.from_file()
    
    def get_tools(self) -> List[Tool]:
        """
        Get list of LangChain tools wrapping GoalOS operations.
        
        Returns:
            List of Tool objects ready for agent use
        """
        return [
            Tool(
                name="goalos_get_priorities",
                func=self._get_priorities,
                description="""
                Get your top priority goals. Returns up to N highest priority
                goals with their status and deadlines.
                Input: JSON with optional fields:
                  - count: number of goals (default: 5)
                  - status: filter by status (active, planned, blocked, etc.)
                  - domain: filter by domain (work, personal, health, etc.)
                Output: Formatted list of top priority goals
                """
            ),
            Tool(
                name="goalos_list_goals",
                func=self._list_goals,
                description="""
                List all goals, optionally filtered by criteria.
                Input: JSON with optional fields:
                  - status: goal status filter
                  - priority: priority level filter
                  - domain: domain filter
                  - include_completed: include completed goals (default: false)
                Output: Formatted list of goals with tree structure
                """
            ),
            Tool(
                name="goalos_get_goal_details",
                func=self._get_goal_details,
                description="""
                Get full details of a specific goal, including description,
                success criteria, dependencies, and sub-goals.
                Input: JSON with field:
                  - goal_id: the ID of the goal to retrieve
                Output: Complete goal details
                """
            ),
            Tool(
                name="goalos_search_goals",
                func=self._search_goals,
                description="""
                Full-text search across goal titles and descriptions.
                Input: JSON with fields:
                  - query: search term(s)
                  - status: optional status filter
                  - domain: optional domain filter
                Output: List of matching goals
                """
            ),
            Tool(
                name="goalos_get_blockers",
                func=self._get_blockers,
                description="""
                Get all goals that are blocking a specific goal.
                Input: JSON with field:
                  - goal_id: the goal to check for blockers
                Output: List of blocking goals with dependency type
                """
            ),
            Tool(
                name="goalos_get_dependencies",
                func=self._get_dependencies,
                description="""
                Get the full dependency chain for a goal.
                Shows what goals this one depends on.
                Input: JSON with field:
                  - goal_id: the goal to get dependencies for
                Output: Hierarchical dependency chain
                """
            ),
            Tool(
                name="goalos_get_context",
                func=self._get_context,
                description="""
                Get a high-level summary of your goal context:
                current priorities, active goals, upcoming deadlines,
                and blocked goals. Good for understanding overall status.
                Input: Empty JSON object {}
                Output: Executive summary of goal landscape
                """
            )
        ]
    
    def _get_priorities(self, input_json: str) -> str:
        """Get top priority goals."""
        import json
        params = json.loads(input_json) if input_json != "{}" else {}
        
        count = params.get("count", 5)
        status_filter = params.get("status")
        domain_filter = params.get("domain")
        
        goals = self.graph.get_top_priorities(n=count)
        
        if status_filter:
            goals = [g for g in goals if g.status == status_filter]
        if domain_filter:
            goals = [g for g in goals if g.domain == domain_filter]
        
        if not goals:
            return "No priority goals found matching criteria."
        
        result = "Top Priority Goals:\n"
        for i, goal in enumerate(goals, 1):
            result += f"\n{i}. {goal.title}\n"
            result += f"   Priority: {goal.priority.level}\n"
            result += f"   Status: {goal.status}\n"
            if goal.deadline:
                result += f"   Deadline: {goal.deadline}\n"
            if goal.description:
                result += f"   Description: {goal.description}\n"
        
        return result
    
    def _list_goals(self, input_json: str) -> str:
        """List all goals with optional filters."""
        import json
        params = json.loads(input_json) if input_json != "{}" else {}
        
        status_filter = params.get("status")
        priority_filter = params.get("priority")
        domain_filter = params.get("domain")
        include_completed = params.get("include_completed", False)
        
        goal_filter = {}
        if status_filter:
            goal_filter["status"] = status_filter
        if priority_filter:
            goal_filter["priority"] = priority_filter
        if domain_filter:
            goal_filter["domain"] = domain_filter
        
        goals = self.graph.query(goal_filter)
        
        if not include_completed:
            goals = [g for g in goals if g.status != "completed"]
        
        if not goals:
            return "No goals found matching criteria."
        
        by_domain = {}
        for goal in goals:
            domain = goal.domain or "General"
            if domain not in by_domain:
                by_domain[domain] = []
            by_domain[domain].append(goal)
        
        result = "Goals by Domain:\n"
        for domain in sorted(by_domain.keys()):
            result += f"\n{domain}:\n"
            for goal in by_domain[domain]:
                result += f"  - {goal.title} [{goal.status}] ({goal.priority.level})\n"
        
        result += f"\nTotal: {len(goals)} goals"
        return result
