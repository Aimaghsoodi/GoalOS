"""GoalOS CrewAI Integration - Goal-aware tools for agent teams"""

from typing import Optional, List
from langchain.tools import Tool
from goalos import IntentGraph


class GoalOSTeam:
    """Provides goal-aware tools for CrewAI agent teams."""

    def __init__(self, graph_path: Optional[str] = None, graph_data: Optional[dict] = None):
        if graph_path:
            self.graph = IntentGraph.from_file(graph_path)
        elif graph_data:
            self.graph = IntentGraph.from_json(graph_data)
        else:
            self.graph = IntentGraph.from_file()

    def get_tools(self) -> List[Tool]:
        return [
            Tool(name="goalos_get_context", func=self._get_context, description="Get goal landscape summary"),
            Tool(name="goalos_list_goals", func=self._list_goals, description="List all goals"),
            Tool(name="goalos_get_goal", func=self._get_goal, description="Get goal details"),
            Tool(name="goalos_search_goals", func=self._search_goals, description="Search goals"),
            Tool(name="goalos_get_blockers", func=self._get_blockers, description="Find blockers"),
            Tool(name="goalos_get_deadlines", func=self._get_deadlines, description="Get deadlines"),
        ]

    def _get_context(self, input_json: str) -> str:
        stats = self.graph.get_stats()
        result = "Goal Context Summary:\n\n"
        result += f"Total Goals: {stats['totalGoals']}\n"
        active = self.graph.get_by_status("active")
        result += f"Active: {len(active)} goals\n"
        top = self.graph.get_top_priorities(n=3)
        if top:
            result += "\nTop Priorities:\n"
            for goal in top:
                result += f"  - {goal.title}\n"
        return result

    def _list_goals(self, input_json: str) -> str:
        import json
        params = json.loads(input_json) if input_json != "{}" else {}
        goals = self.graph.goals
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
                result += f"  - {goal.title}\n"
        return result

    def _get_goal(self, input_json: str) -> str:
        import json
        params = json.loads(input_json)
        goal = self.graph.get_goal(params.get("goal_id"))
        if not goal:
            return "Goal not found"
        result = f"Goal: {goal.title}\nStatus: {goal.status}\n"
        if goal.description:
            result += f"Description: {goal.description}\n"
        return result

    def _search_goals(self, input_json: str) -> str:
        import json
        params = json.loads(input_json)
        query = params.get("query", "").lower()
        results = [g for g in self.graph.goals if query in g.title.lower()]
        if not results:
            return f"No goals match '{query}'"
        return f"Found {len(results)} goal(s):\n" + "\n".join(f"- {g.title}" for g in results)

    def _get_blockers(self, input_json: str) -> str:
        import json
        params = json.loads(input_json)
        blockers = self.graph.get_blockers(params.get("goal_id"))
        if not blockers:
            return "No blockers"
        return "Blocking goals:\n" + "\n".join(f"- {b.title}" for b in blockers)

    def _get_deadlines(self, input_json: str) -> str:
        import json
        from datetime import datetime, timedelta
        params = json.loads(input_json) if input_json != "{}" else {}
        days_ahead = params.get("days_ahead", 7)
        now = datetime.now()
        cutoff = now + timedelta(days=days_ahead)
        upcoming = [(g, datetime.fromisoformat(g.deadline)) for g in self.graph.goals if g.deadline and now <= datetime.fromisoformat(g.deadline) <= cutoff]
        if not upcoming:
            return f"No deadlines in next {days_ahead} days"
        upcoming.sort(key=lambda x: x[1])
        return "Deadlines:\n" + "\n".join(f"- {g[0].title} (in {(g[1] - now).days} days)" for g in upcoming)
