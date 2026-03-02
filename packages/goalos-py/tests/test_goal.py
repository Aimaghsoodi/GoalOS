"""
Tests for Goal management
"""

import pytest
import json
from datetime import datetime, timedelta
from goalos import GoalManager, Priority, Dependency, Permission, PermissionCapability


class TestGoalCreation:
    """Test goal creation"""

    def test_create_basic_goal(self):
        """Test creating a basic goal"""
        goal = GoalManager.create(title="Test Goal")
        assert goal.title == "Test Goal"
        assert goal.status == "planned"
        assert goal.priority.level == "medium"
        assert goal.version == 1

    def test_create_goal_with_all_fields(self):
        """Test creating a goal with all fields"""
        deadline = (datetime.utcnow() + timedelta(days=30)).isoformat() + "Z"
        goal = GoalManager.create(
            title="Complete Project",
            description="Ship MVP",
            priority=Priority(level="high", score=80),
            domain="work",
            tags=["urgent", "product"],
            deadline=deadline,
            time_horizon="this_month",
            success_criteria=["Tests pass", "Users happy"],
            motivation="Launch business",
            created_by="user1",
        )
        assert goal.title == "Complete Project"
        assert goal.priority.level == "high"
        assert goal.domain == "work"
        assert len(goal.tags) == 2
        assert len(goal.successCriteria) == 2

    def test_goal_id_generation(self):
        """Test that goal IDs are unique"""
        goal1 = GoalManager.create(title="Goal 1")
        goal2 = GoalManager.create(title="Goal 2")
        assert goal1.id != goal2.id
        assert goal1.id.startswith("goal_")
        assert goal2.id.startswith("goal_")

    def test_goal_timestamps(self):
        """Test that timestamps are set correctly"""
        goal = GoalManager.create(title="Test")
        assert goal.createdAt is not None
        assert goal.updatedAt is not None
        assert goal.completedAt is None


class TestGoalUpdate:
    """Test goal updates"""

    def test_update_goal(self):
        """Test updating a goal"""
        goal = GoalManager.create(title="Original")
        updated = GoalManager.update(goal, {"title": "Updated"})
        assert updated.title == "Updated"
        assert updated.id == goal.id  # ID unchanged
        assert updated.version == 2  # Version incremented

    def test_update_preserves_immutable_fields(self):
        """Test that immutable fields are preserved"""
        goal = GoalManager.create(title="Test")
        original_id = goal.id
        original_created = goal.createdAt

        updated = GoalManager.update(goal, {"status": "active"})
        assert updated.id == original_id
        assert updated.createdAt == original_created


class TestGoalStatusTransitions:
    """Test goal status transitions"""

    def test_complete_goal(self):
        """Test completing a goal"""
        goal = GoalManager.create(title="Test", status="active")
        completed = GoalManager.complete(goal)
        assert completed.status == "completed"
        assert completed.completedAt is not None

    def test_complete_idempotent(self):
        """Test that completing is idempotent"""
        goal = GoalManager.create(title="Test", status="completed")
        completed = GoalManager.complete(goal)
        assert completed == goal

    def test_abandon_goal(self):
        """Test abandoning a goal"""
        goal = GoalManager.create(title="Test")
        abandoned = GoalManager.abandon(goal, reason="Not priority")
        assert abandoned.status == "abandoned"
        assert abandoned.metadata.get("abandonReason") == "Not priority"

    def test_block_goal(self):
        """Test blocking a goal"""
        goal = GoalManager.create(title="Test")
        blocked = GoalManager.block(goal, blocked_by="other_goal_id")
        assert blocked.status == "blocked"
        assert blocked.metadata.get("blockedBy") == "other_goal_id"

    def test_unblock_goal(self):
        """Test unblocking a goal"""
        goal = GoalManager.create(title="Test")
        blocked = GoalManager.block(goal)
        unblocked = GoalManager.unblock(blocked)
        assert unblocked.status == "active"
        assert "blockedBy" not in unblocked.metadata

    def test_pause_resume(self):
        """Test pausing and resuming"""
        goal = GoalManager.create(title="Test", status="active")
        paused = GoalManager.pause(goal)
        assert paused.status == "paused"

        resumed = GoalManager.resume(paused)
        assert resumed.status == "active"


class TestDependencies:
    """Test dependency management"""

    def test_add_dependency(self):
        """Test adding a dependency"""
        goal = GoalManager.create(title="Test")
        dep = Dependency(type="requires", targetGoalId="goal_target")
        updated = GoalManager.add_dependency(goal, dep)
        assert len(updated.dependencies) == 1
        assert updated.dependencies[0].targetGoalId == "goal_target"

    def test_add_duplicate_dependency(self):
        """Test that duplicate dependencies are not added"""
        goal = GoalManager.create(title="Test")
        dep = Dependency(type="requires", targetGoalId="goal_target")
        goal1 = GoalManager.add_dependency(goal, dep)
        goal2 = GoalManager.add_dependency(goal1, dep)
        assert len(goal2.dependencies) == 1

    def test_remove_dependency(self):
        """Test removing a dependency"""
        goal = GoalManager.create(title="Test")
        dep = Dependency(type="requires", targetGoalId="goal_target")
        goal = GoalManager.add_dependency(goal, dep)
        updated = GoalManager.remove_dependency(goal, "goal_target")
        assert len(updated.dependencies) == 0

    def test_remove_dependency_by_type(self):
        """Test removing specific dependency type"""
        goal = GoalManager.create(title="Test")
        goal = GoalManager.add_dependency(
            goal, Dependency(type="requires", targetGoalId="goal_target")
        )
        goal = GoalManager.add_dependency(
            goal, Dependency(type="blocks", targetGoalId="goal_target")
        )
        updated = GoalManager.remove_dependency(goal, "goal_target", dep_type="requires")
        assert len(updated.dependencies) == 1
        assert updated.dependencies[0].type == "blocks"


class TestPermissions:
    """Test permission management"""

    def test_add_permission(self):
        """Test adding a permission"""
        goal = GoalManager.create(title="Test")
        perm = Permission(
            agentId="agent1",
            capabilities=["read", "write"],
        )
        updated = GoalManager.add_permission(goal, perm)
        assert len(updated.permissions) == 1
        assert updated.permissions[0].agentId == "agent1"

    def test_replace_permission(self):
        """Test that updating permission replaces old one"""
        goal = GoalManager.create(title="Test")
        perm1 = Permission(agentId="agent1", capabilities=["read"])
        goal = GoalManager.add_permission(goal, perm1)

        perm2 = Permission(agentId="agent1", capabilities=["read", "write"])
        updated = GoalManager.add_permission(goal, perm2)
        assert len(updated.permissions) == 1
        assert "write" in updated.permissions[0].capabilities

    def test_remove_permission(self):
        """Test removing a permission"""
        goal = GoalManager.create(title="Test")
        perm = Permission(agentId="agent1", capabilities=["read"])
        goal = GoalManager.add_permission(goal, perm)
        updated = GoalManager.remove_permission(goal, "agent1")
        assert len(updated.permissions) == 0


class TestPriority:
    """Test priority management"""

    def test_set_priority(self):
        """Test setting priority"""
        goal = GoalManager.create(title="Test")
        new_priority = Priority(level="critical", score=95)
        updated = GoalManager.set_priority(goal, new_priority)
        assert updated.priority.level == "critical"
        assert updated.priority.score == 95

    def test_is_overdue(self):
        """Test overdue detection"""
        past_deadline = (datetime.utcnow() - timedelta(days=1)).isoformat() + "Z"
        goal = GoalManager.create(
            title="Test",
            deadline=past_deadline,
            status="active",
        )
        assert GoalManager.is_overdue(goal)

    def test_days_until_deadline(self):
        """Test deadline calculation"""
        future_deadline = (datetime.utcnow() + timedelta(days=5)).isoformat() + "Z"
        goal = GoalManager.create(title="Test", deadline=future_deadline)
        days = GoalManager.days_until_deadline(goal)
        assert days is not None
        assert 4 <= days <= 6  # Allow for slight time differences


class TestValidation:
    """Test validation"""

    def test_valid_goal(self):
        """Test that valid goal passes validation"""
        goal = GoalManager.create(
            title="Test",
            priority=Priority(level="high"),
        )
        # Should not raise
        assert goal.title == "Test"

    def test_invalid_title(self):
        """Test that empty title fails"""
        with pytest.raises(ValueError):
            GoalManager.create(title="")

    def test_goal_completeness(self):
        """Test goal completeness check"""
        complete_goal = GoalManager.create(
            title="Test",
            deadline="2024-12-31T23:59:59Z",
            success_criteria=["Done"],
        )
        assert GoalManager.is_complete(complete_goal)


class TestSerialization:
    """Test serialization"""

    def test_to_json(self):
        """Test converting to JSON"""
        goal = GoalManager.create(title="Test", domain="work")
        json_str = GoalManager.to_json(goal)
        assert isinstance(json_str, str)
        data = json.loads(json_str)
        assert data["title"] == "Test"

    def test_from_json(self):
        """Test creating from JSON"""
        goal = GoalManager.create(title="Test", domain="work")
        json_str = GoalManager.to_json(goal)

        # Recreate from JSON
        recreated = GoalManager.from_json(json_str)
        assert recreated.title == goal.title
        assert recreated.id == goal.id

    def test_from_dict(self):
        """Test creating from dict"""
        goal = GoalManager.create(title="Test")
        data = goal.model_dump()
        recreated = GoalManager.from_json(data)
        assert recreated.title == goal.title
