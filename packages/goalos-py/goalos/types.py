"""
GoalOS Type Definitions
Pydantic models for all GoalOS types
"""

from typing import Any, Dict, List, Optional, Literal, Union
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, validator


# Type aliases
GoalStatus = Literal["active", "planned", "blocked", "paused", "completed", "abandoned"]
PriorityLevel = Literal["critical", "high", "medium", "low", "someday"]
TimeHorizon = Literal["today", "this_week", "this_month", "this_quarter", "this_year", "long_term"]
DurationUnit = Literal["minutes", "hours", "days", "weeks"]
DependencyType = Literal["blocks", "requires", "enables", "related"]
PermissionCapability = Literal["read", "write", "complete", "create_sub_goals", "reprioritize"]
GoalEventType = Literal[
    "goal.created",
    "goal.updated",
    "goal.completed",
    "goal.abandoned",
    "goal.blocked",
    "goal.unblocked",
    "goal.prioritized",
    "goal.dependency_added",
    "goal.dependency_removed",
    "goal.permission_granted",
    "goal.permission_revoked",
]
MergeStrategy = Literal["latest_wins", "manual", "most_restrictive"]


class Duration(BaseModel):
    """Duration specification"""
    value: int = Field(..., description="Numeric value")
    unit: DurationUnit = Field(..., description="Unit of time")


class Priority(BaseModel):
    """Priority specification"""
    level: PriorityLevel = Field(..., description="Priority level")
    score: Optional[int] = Field(None, description="Optional numeric score (0-100) for sorting", ge=0, le=100)
    reason: Optional[str] = Field(None, description="Reason for this priority")


class Dependency(BaseModel):
    """Dependency between goals"""
    type: DependencyType = Field(..., description="Type of dependency relationship")
    targetGoalId: str = Field(..., description="Target goal ID")
    description: Optional[str] = Field(None, description="Optional description of the dependency")


class PermissionScope(BaseModel):
    """Permission scope constraints"""
    goalIds: Optional[List[str]] = Field(None, description="Specific goal IDs this permission applies to")
    domains: Optional[List[str]] = Field(None, description="Domains this permission applies to")
    maxDepth: Optional[int] = Field(None, description="Maximum depth in goal hierarchy")


class Permission(BaseModel):
    """Agent permission definition"""
    agentId: str = Field(..., description="Agent/user ID")
    capabilities: List[PermissionCapability] = Field(..., description="Capabilities granted")
    scope: Optional[PermissionScope] = Field(None, description="Optional scope constraints")


class Goal(BaseModel):
    """Core Goal model"""
    model_config = ConfigDict(extra="allow")

    id: str = Field(..., description="Unique identifier (nanoid format: goal_...)")
    title: str = Field(..., description="Short, descriptive title")
    description: Optional[str] = Field(None, description="Longer explanation of the goal")
    parentId: Optional[str] = Field(None, description="Parent goal ID (null = root goal)")
    status: GoalStatus = Field(..., description="Current status of the goal")
    priority: Priority = Field(..., description="Priority specification")
    successCriteria: Optional[List[str]] = Field(None, description="Measurable criteria for completion")
    deadline: Optional[str] = Field(None, description="ISO 8601 deadline")
    timeHorizon: Optional[TimeHorizon] = Field(None, description="Time horizon for completion")
    estimatedEffort: Optional[Duration] = Field(None, description="Estimated effort")
    motivation: Optional[str] = Field(None, description="Why this goal matters")
    tags: Optional[List[str]] = Field(None, description="Tags for categorization")
    domain: Optional[str] = Field(None, description="Domain: work, personal, health, creative, etc.")
    dependencies: Optional[List[Dependency]] = Field(None, description="Dependencies on other goals")
    permissions: Optional[List[Permission]] = Field(None, description="Permissions for agents")
    createdAt: str = Field(..., description="ISO 8601 creation timestamp")
    updatedAt: str = Field(..., description="ISO 8601 last updated timestamp")
    completedAt: Optional[str] = Field(None, description="ISO 8601 completion timestamp")
    createdBy: Optional[str] = Field(None, description="Agent or user that created this goal")
    version: int = Field(..., description="Schema version for this goal")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Arbitrary metadata")

class IntentGraph(BaseModel):
    """Intent graph - collection of related goals"""
    model_config = ConfigDict(extra="allow")

    id: str = Field(..., description="Unique identifier")
    version: str = Field(..., description="GoalOS spec version")
    owner: str = Field(..., description="Owner/user ID")
    name: Optional[str] = Field(None, description="Optional name for the graph")
    description: Optional[str] = Field(None, description="Optional description")
    goals: List[Goal] = Field(default_factory=list, description="All goals in the graph")
    defaultPermissions: Optional[List[Permission]] = Field(None, description="Default permissions for new goals")
    createdAt: str = Field(..., description="ISO 8601 creation timestamp")
    updatedAt: str = Field(..., description="ISO 8601 last updated timestamp")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Arbitrary metadata")

class GoalEvent(BaseModel):
    """Goal event in the event log"""
    id: str = Field(..., description="Unique event ID")
    type: GoalEventType = Field(..., description="Type of event")
    goalId: str = Field(..., description="Target goal ID")
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    agentId: Optional[str] = Field(None, description="Agent/user that triggered the event")
    data: Optional[Dict[str, Any]] = Field(None, description="Event-specific data")
    previousState: Optional[Dict[str, Any]] = Field(None, description="Previous goal state for mutations")


class GoalFilter(BaseModel):
    """Goal filter for querying"""
    status: Optional[Union[GoalStatus, List[GoalStatus]]] = Field(None, description="Filter by status or statuses")
    priority: Optional[Union[PriorityLevel, List[PriorityLevel]]] = Field(None, description="Filter by priority level or levels")
    domain: Optional[Union[str, List[str]]] = Field(None, description="Filter by domain or domains")
    tags: Optional[List[str]] = Field(None, description="Filter by tags (must have all tags)")
    timeHorizon: Optional[TimeHorizon] = Field(None, description="Filter by time horizon")
    parentId: Optional[str] = Field(None, description="Filter by parent goal ID")
    hasDeadline: Optional[bool] = Field(None, description="Filter only goals with deadlines")
    deadlineBefore: Optional[str] = Field(None, description="Filter goals with deadline before date (ISO 8601)")
    deadlineAfter: Optional[str] = Field(None, description="Filter goals with deadline after date (ISO 8601)")
    createdAfter: Optional[str] = Field(None, description="Filter goals created after date (ISO 8601)")
    createdBefore: Optional[str] = Field(None, description="Filter goals created before date (ISO 8601)")
    search: Optional[str] = Field(None, description="Full-text search on title and description")


class GoalTreeNode(BaseModel):
    """Goal tree node for hierarchical representation"""
    goal: Goal = Field(..., description="The goal object")
    children: List["GoalTreeNode"] = Field(default_factory=list, description="Child goals")
    depth: int = Field(..., description="Depth in tree (0 = root)")
    progress: float = Field(..., description="Completion progress (0-1)")


# Update forward references
GoalTreeNode.model_rebuild()


class MergeConflict(BaseModel):
    """Merge conflict between two versions of a goal"""
    goalId: str = Field(..., description="ID of the conflicting goal")
    field: str = Field(..., description="Field that has the conflict")
    localValue: Any = Field(..., description="Local (current) value")
    remoteValue: Any = Field(..., description="Remote (incoming) value")


class MergeResult(BaseModel):
    """Result of merging two intent graphs"""
    merged: IntentGraph = Field(..., description="Merged intent graph")
    conflicts: List[MergeConflict] = Field(default_factory=list, description="Conflicts that occurred")
    added: List[Goal] = Field(default_factory=list, description="Goals added from remote")
    updated: List[Goal] = Field(default_factory=list, description="Goals updated from remote")
    removed: List[Goal] = Field(default_factory=list, description="Goals removed")


class ValidationError(BaseModel):
    """Validation error"""
    message: str = Field(..., description="Error message")
    path: Optional[str] = Field(None, description="Path to invalid data")
    data: Optional[Any] = Field(None, description="Optional error data")


class ValidationWarning(BaseModel):
    """Validation warning"""
    message: str = Field(..., description="Warning message")
    path: Optional[str] = Field(None, description="Path to problematic data")
    data: Optional[Any] = Field(None, description="Optional warning data")


class ValidationResult(BaseModel):
    """Validation result"""
    valid: bool = Field(..., description="Whether the graph is valid")
    errors: List[ValidationError] = Field(default_factory=list, description="Validation errors")
    warnings: List[ValidationWarning] = Field(default_factory=list, description="Validation warnings")


class GraphStats(BaseModel):
    """Graph statistics"""
    totalGoals: int = Field(..., description="Total number of goals")
    byStatus: Dict[GoalStatus, int] = Field(default_factory=dict, description="Goals grouped by status")
    byPriority: Dict[PriorityLevel, int] = Field(default_factory=dict, description="Goals grouped by priority level")
    byDomain: Dict[str, int] = Field(default_factory=dict, description="Goals grouped by domain")
    completionRate: float = Field(..., description="Overall completion rate (0-1)")
    averageDepth: float = Field(..., description="Average goal hierarchy depth")
    orphanedGoals: int = Field(..., description="Number of orphaned goals")


class QueryResult(BaseModel):
    """Query result metadata"""
    goals: List[Goal] = Field(default_factory=list, description="Matching goals")
    total: int = Field(..., description="Total match count")
    executionTime: int = Field(..., description="Query execution time in milliseconds")
