"""
Tests for IntentGraph functionality
"""

import pytest
import json
from goalos import IntentGraphManager, Priority, Dependency, Permission, GoalFilter


class TestIntentGraphCreation:
    """Test graph creation and initialization"""

    def test_create_graph(self):
        """Test creating a new graph"""
        graph = IntentGraphManager.create(owner="user1", name="Test Graph")
        assert graph.graph.owner == "user1"
        assert graph.graph.name == "Test Graph"
        assert graph.graph.version == "0.1.0"
        assert len(graph.graph.goals) == 0

    def test_from_json(self):
        """Test creating graph from JSON"""
        data = {
            "id": "graph_test",
            "version": "0.1.0",
            "owner": "user1",
            "name": "Test",
            "goals": [],
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T00:00:00Z",
        }
        graph = IntentGraphManager.from_json(data)
        assert graph.graph.owner == "user1"
        assert graph.graph.id == "graph_test"


class TestGoalManagement:
    """Test goal CRUD operations"""

    def test_add_goal(self, sample_graph):
        """Test adding a goal"""
        goal = sample_graph.add_goal(
            title="Test Goal",
            priority=Priority(level="high"),
            domain="work",
        )
        assert goal.title == "Test Goal"
        assert goal.priority.level == "high"
        assert goal.domain == "work"
        assert len(sample_graph.graph.goals) == 1

    def test_get_goal(self, sample_graph):
        """Test retrieving a goal"""
        goal = sample_graph.add_goal(title="Test Goal")
        retrieved = sample_graph.get_goal(goal.id)
        assert retrieved is not None
        assert retrieved.id == goal.id
        assert retrieved.title == "Test Goal"

    def test_update_goal(self, sample_graph):
        """Test updating a goal"""
        goal = sample_graph.add_goal(title="Test Goal")
        updated = sample_graph.update_goal(
            goal.id,
            {"title": "Updated Goal", "status": "active"},
        )
        assert updated.title == "Updated Goal"
        assert updated.status == "active"

    def test_remove_goal(self, sample_graph):
        """Test removing a goal"""
        goal = sample_graph.add_goal(title="Test Goal")
        assert len(sample_graph.graph.goals) == 1
        sample_graph.remove_goal(goal.id)
        assert len(sample_graph.graph.goals) == 0

    def test_remove_goal_with_children(self, graph_with_goals):
        """Test removing a goal with children"""
        graph, goals = graph_with_goals
        root_id = goals["root"].id
        assert len(graph.graph.goals) == 4

        graph.remove_goal(root_id, remove_children=True)
        assert len(graph.graph.goals) == 1  # Only goal3 remains


class TestGoalStatusTransitions:
    """Test status transitions"""

    def test_complete_goal(self, sample_graph):
        """Test completing a goal"""
        goal = sample_graph.add_goal(title="Test Goal", status="active")
        completed = sample_graph.complete_goal(goal.id)
        assert completed.status == "completed"
        assert completed.completedAt is not None

    def test_abandon_goal(self, sample_graph):
        """Test abandoning a goal"""
        goal = sample_graph.add_goal(title="Test Goal")
        abandoned = sample_graph.abandon_goal(goal.id, reason="No longer relevant")
        assert abandoned.status == "abandoned"
        assert abandoned.metadata.get("abandonReason") == "No longer relevant"

    def test_block_goal(self, sample_graph):
        """Test blocking a goal"""
        goal = sample_graph.add_goal(title="Test Goal")
        blocked = sample_graph.block_goal(goal.id, blocked_by="other_goal")
        assert blocked.status == "blocked"
        assert blocked.metadata.get("blockedBy") == "other_goal"

    def test_unblock_goal(self, sample_graph):
        """Test unblocking a goal"""
        goal = sample_graph.add_goal(title="Test Goal", status="active")
        blocked = sample_graph.block_goal(goal.id)
        unblocked = sample_graph.unblock_goal(goal.id)
        assert unblocked.status == "active"
        assert "blockedBy" not in unblocked.metadata


class TestDependencies:
    """Test dependency management"""

    def test_add_dependency(self, graph_with_goals):
        """Test adding a dependency"""
        graph, goals = graph_with_goals
        goal1_id = goals["goal1"].id
        goal2_id = goals["goal2"].id

        graph.add_dependency(
            goal1_id,
            Dependency(type="requires", targetGoalId=goal2_id),
        )

        updated = graph.get_goal(goal1_id)
        assert updated is not None
        assert len(updated.dependencies) == 1
        assert updated.dependencies[0].targetGoalId == goal2_id

    def test_cycle_detection(self, graph_with_goals):
        """Test cycle detection"""
        graph, goals = graph_with_goals
        goal1_id = goals["goal1"].id
        goal2_id = goals["goal2"].id

        # Add dependency: goal1 requires goal2
        graph.add_dependency(
            goal1_id,
            Dependency(type="requires", targetGoalId=goal2_id),
        )

        # Try to add circular dependency
        with pytest.raises(ValueError, match="would create a cycle"):
            graph.add_dependency(
                goal2_id,
                Dependency(type="requires", targetGoalId=goal1_id),
            )

    def test_get_dependency_chain(self, graph_with_dependencies):
        """Test getting dependency chain"""
        graph, goals = graph_with_dependencies
        chain = graph.get_dependency_chain(goals["goal1"].id)
        assert len(chain) >= 1
        assert chain[0].id == goals["goal1"].id


class TestQueries:
    """Test query operations"""

    def test_get_top_priorities(self, graph_with_goals):
        """Test getting top priorities"""
        graph, goals = graph_with_goals
        priorities = graph.get_top_priorities(count=2)
        assert len(priorities) <= 2

    def test_get_by_status(self, graph_with_goals):
        """Test filtering by status"""
        graph, goals = graph_with_goals
        sample_graph = IntentGraphManager.create(owner="test")
        sample_graph.add_goal(title="Active", status="active")
        sample_graph.add_goal(title="Planned", status="planned")

        active = sample_graph.get_by_status("active")
        assert len(active) == 1
        assert active[0].title == "Active"

    def test_get_by_domain(self, graph_with_goals):
        """Test filtering by domain"""
        graph, goals = graph_with_goals
        work_goals = graph.get_by_domain("work")
        assert len(work_goals) >= 2

    def test_get_children(self, graph_with_goals):
        """Test getting child goals"""
        graph, goals = graph_with_goals
        children = graph.get_children(goals["root"].id)
        assert len(children) == 2

    def test_get_descendants(self, graph_with_goals):
        """Test getting all descendants"""
        graph, goals = graph_with_goals
        descendants = graph.get_descendants(goals["root"].id)
        assert len(descendants) == 2

    def test_query_with_filter(self, graph_with_goals):
        """Test complex query"""
        graph, goals = graph_with_goals
        filter_obj = GoalFilter(domain="work", status=["active", "planned"])
        results = graph.query(filter_obj)
        assert all(g.domain == "work" for g in results)


class TestHierarchy:
    """Test goal hierarchy operations"""

    def test_get_tree(self, graph_with_goals):
        """Test getting goal tree"""
        graph, goals = graph_with_goals
        tree = graph.get_tree()
        assert len(tree) >= 1

    def test_move_goal(self, graph_with_goals):
        """Test moving goal to new parent"""
        graph, goals = graph_with_goals
        new_parent_id = goals["goal1"].id
        goal2 = graph.get_goal(goals["goal2"].id)
        assert goal2.parentId == goals["root"].id

        graph.move_goal(goals["goal2"].id, new_parent_id)
        updated = graph.get_goal(goals["goal2"].id)
        assert updated.parentId == new_parent_id


class TestValidation:
    """Test validation"""

    def test_validate_graph(self, graph_with_goals):
        """Test graph validation"""
        graph, _ = graph_with_goals
        result = graph.validate()
        assert isinstance(result.valid, bool)

    def test_detect_cycles(self, graph_with_dependencies):
        """Test cycle detection in graph"""
        graph, goals = graph_with_dependencies
        cycles = graph.detect_cycles()
        # Should not have cycles with our test setup
        assert cycles is None or len(cycles) == 0


class TestStatistics:
    """Test statistics"""

    def test_get_stats(self, graph_with_goals):
        """Test getting statistics"""
        graph, goals = graph_with_goals
        stats = graph.get_stats()
        assert stats.totalGoals == 4
        assert "work" in stats.byDomain

    def test_completion_rate(self, sample_graph):
        """Test completion rate calculation"""
        sample_graph.add_goal(title="Goal 1", status="active")
        sample_graph.add_goal(title="Goal 2", status="completed")
        rate = sample_graph.get_completion_rate()
        assert rate == 0.5

    def test_get_progress(self, graph_with_goals):
        """Test progress calculation"""
        graph, goals = graph_with_goals
        progress = graph.get_progress(goals["root"].id)
        assert 0 <= progress <= 1


class TestSerialization:
    """Test serialization"""

    def test_to_json_str(self, sample_graph):
        """Test converting to JSON string"""
        sample_graph.add_goal(title="Test")
        json_str = sample_graph.to_json_str()
        assert isinstance(json_str, str)
        data = json.loads(json_str)
        assert data["owner"] == sample_graph.graph.owner

    def test_to_dict(self, sample_graph):
        """Test converting to dict"""
        sample_graph.add_goal(title="Test")
        data = sample_graph.to_dict()
        assert isinstance(data, dict)
        assert data["owner"] == sample_graph.graph.owner

    def test_to_jsonld(self, sample_graph):
        """Test converting to JSON-LD"""
        sample_graph.add_goal(title="Test")
        data = sample_graph.to_jsonld()
        assert "@context" in data
        assert "@id" in data
