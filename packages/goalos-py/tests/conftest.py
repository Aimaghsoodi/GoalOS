"""
Shared test fixtures for GoalOS tests
"""

import pytest
from datetime import datetime, timedelta

from goalos import (
    IntentGraphManager,
    GoalManager,
    Priority,
    Duration,
    Dependency,
)


@pytest.fixture
def sample_priority() -> Priority:
    """Sample priority object"""
    return Priority(level="high", score=75, reason="Important milestone")


@pytest.fixture
def sample_duration() -> Duration:
    """Sample duration object"""
    return Duration(value=2, unit="weeks")


@pytest.fixture
def sample_goal(sample_priority):
    """Create a sample goal"""
    return GoalManager.create(
        title="Launch product",
        description="Ship the MVP to production",
        priority=sample_priority,
        domain="work",
        tags=["product", "urgent"],
        deadline=(datetime.utcnow() + timedelta(days=30)).isoformat() + "Z",
        success_criteria=["Users can sign up", "API is stable"],
    )


@pytest.fixture
def sample_graph():
    """Create a sample intent graph"""
    return IntentGraphManager.create(owner="user123", name="Q1 Goals")


@pytest.fixture
def graph_with_goals(sample_graph, sample_priority):
    """Create a graph with multiple goals"""
    # Add root goal
    root = sample_graph.add_goal(
        title="Scale the business",
        priority=Priority(level="critical"),
        domain="work",
    )

    # Add child goals
    goal1 = sample_graph.add_goal(
        title="Improve product",
        parent_id=root.id,
        priority=Priority(level="high"),
        domain="work",
    )

    goal2 = sample_graph.add_goal(
        title="Expand team",
        parent_id=root.id,
        priority=Priority(level="medium"),
        domain="work",
    )

    # Add sibling
    goal3 = sample_graph.add_goal(
        title="Personal development",
        priority=Priority(level="medium"),
        domain="personal",
    )

    return sample_graph, {
        "root": root,
        "goal1": goal1,
        "goal2": goal2,
        "goal3": goal3,
    }


@pytest.fixture
def graph_with_dependencies(graph_with_goals):
    """Create a graph with dependencies"""
    graph, goals = graph_with_goals

    # Add dependency: goal1 requires goal2
    graph.add_dependency(
        goals["goal1"].id,
        Dependency(
            type="requires",
            targetGoalId=goals["goal2"].id,
            description="Need team before improving product",
        ),
    )

    return graph, goals
