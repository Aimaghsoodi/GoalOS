"""
Permission management for agent access control
"""

from typing import List, Optional

from .types import (
    Goal,
    Permission,
    PermissionCapability,
    PermissionScope,
)


class PermissionManager:
    """Manages permissions for agent access to goals"""

    @staticmethod
    def grant_permission(
        agent_id: str,
        capabilities: List[PermissionCapability],
        scope: Optional[PermissionScope] = None,
        permissions: Optional[List[Permission]] = None,
    ) -> Permission:
        """Create a new permission for an agent"""
        return Permission(
            agentId=agent_id,
            capabilities=capabilities,
            scope=scope,
        )

    @staticmethod
    def revoke_permission(
        agent_id: str,
        permissions: Optional[List[Permission]] = None,
    ) -> List[Permission]:
        """Revoke all permissions for an agent"""
        if not permissions:
            return []
        return [p for p in permissions if p.agentId != agent_id]

    @staticmethod
    def revoke_all_permissions(
        agent_id: str,
        permissions: Optional[List[Permission]] = None,
    ) -> List[Permission]:
        """Revoke all permissions for an agent"""
        return PermissionManager.revoke_permission(agent_id, permissions)

    @staticmethod
    def get_agent_permissions(
        agent_id: str,
        permissions: Optional[List[Permission]] = None,
    ) -> Optional[Permission]:
        """Get permissions for a specific agent"""
        if not permissions:
            return None
        return next(
            (p for p in permissions if p.agentId == agent_id),
            None
        )

    @staticmethod
    def has_capability(
        agent_id: str,
        capability: PermissionCapability,
        goal: Goal,
        permissions: Optional[List[Permission]] = None,
    ) -> bool:
        """Check if an agent has a specific capability for a goal"""
        if not permissions:
            return False

        # Find agent permissions from both goal and default
        agent_perms = [p for p in permissions if p.agentId == agent_id]
        if not agent_perms:
            return False

        # Check if any permission grants the capability
        for perm in agent_perms:
            if capability not in perm.capabilities:
                continue

            # Check scope constraints
            if perm.scope:
                if perm.scope.goalIds and goal.id not in perm.scope.goalIds:
                    continue
                if perm.scope.domains and goal.domain and goal.domain not in perm.scope.domains:
                    continue
                # maxDepth would need parent chain calculation

            return True

        return False

    @staticmethod
    def can_read(
        agent_id: str,
        goal: Goal,
        permissions: Optional[List[Permission]] = None,
    ) -> bool:
        """Check if agent can read a goal"""
        return PermissionManager.has_capability(agent_id, "read", goal, permissions)

    @staticmethod
    def can_write(
        agent_id: str,
        goal: Goal,
        permissions: Optional[List[Permission]] = None,
    ) -> bool:
        """Check if agent can write to a goal"""
        return PermissionManager.has_capability(agent_id, "write", goal, permissions)

    @staticmethod
    def can_complete(
        agent_id: str,
        goal: Goal,
        permissions: Optional[List[Permission]] = None,
    ) -> bool:
        """Check if agent can complete a goal"""
        return PermissionManager.has_capability(agent_id, "complete", goal, permissions)

    @staticmethod
    def can_create_sub_goals(
        agent_id: str,
        goal: Goal,
        permissions: Optional[List[Permission]] = None,
    ) -> bool:
        """Check if agent can create sub-goals"""
        return PermissionManager.has_capability(agent_id, "create_sub_goals", goal, permissions)

    @staticmethod
    def can_reprioritize(
        agent_id: str,
        goal: Goal,
        permissions: Optional[List[Permission]] = None,
    ) -> bool:
        """Check if agent can reprioritize a goal"""
        return PermissionManager.has_capability(agent_id, "reprioritize", goal, permissions)

    @staticmethod
    def filter_goals_readable(
        agent_id: str,
        goals: List[Goal],
        permissions: Optional[List[Permission]] = None,
    ) -> List[Goal]:
        """Filter goals to only those readable by agent"""
        return [
            g for g in goals
            if PermissionManager.can_read(agent_id, g, permissions)
        ]

    @staticmethod
    def filter_goals_writable(
        agent_id: str,
        goals: List[Goal],
        permissions: Optional[List[Permission]] = None,
    ) -> List[Goal]:
        """Filter goals to only those writable by agent"""
        return [
            g for g in goals
            if PermissionManager.can_write(agent_id, g, permissions)
        ]
