"""
GoalOS Python SDK
The personal AI intent graph for multi-agent alignment
"""

__version__ = "0.1.0"
__author__ = "Abtin Rad"
__license__ = "MIT"

# Type definitions
from .types import (
    Goal,
    IntentGraph,
    GoalEvent,
    GoalEventType,
    GoalFilter,
    GoalTreeNode,
    GoalStatus,
    Priority,
    PriorityLevel,
    TimeHorizon,
    Dependency,
    DependencyType,
    Permission,
    PermissionCapability,
    PermissionScope,
    Duration,
    DurationUnit,
    ValidationError,
    ValidationWarning,
    ValidationResult,
    GraphStats,
    QueryResult,
    MergeResult,
    MergeConflict,
    MergeStrategy,
)

# Core classes
from .graph import IntentGraphManager, IntentGraphClient
from .goal import GoalManager
from .priority import PriorityEngine
from .permissions import PermissionManager
from .validation import Validator
from .serialization import Serializer
from .query import QueryEngine
from .client import GoalOSClient

# Utilities
from .utils import (
    generate_goal_id,
    generate_graph_id,
    get_current_timestamp,
    is_overdue,
    days_until_deadline,
)

__all__ = [
    # Version
    "__version__",
    # Types
    "Goal",
    "IntentGraph",
    "GoalEvent",
    "GoalEventType",
    "GoalFilter",
    "GoalTreeNode",
    "GoalStatus",
    "Priority",
    "PriorityLevel",
    "TimeHorizon",
    "Dependency",
    "DependencyType",
    "Permission",
    "PermissionCapability",
    "PermissionScope",
    "Duration",
    "DurationUnit",
    "ValidationError",
    "ValidationWarning",
    "ValidationResult",
    "GraphStats",
    "QueryResult",
    "MergeResult",
    "MergeConflict",
    "MergeStrategy",
    # Core classes
    "IntentGraphManager",
    "IntentGraphClient",
    "GoalManager",
    "PriorityEngine",
    "PermissionManager",
    "Validator",
    "Serializer",
    "QueryEngine",
    "GoalOSClient",
    # Utilities
    "generate_goal_id",
    "generate_graph_id",
    "get_current_timestamp",
    "is_overdue",
    "days_until_deadline",
]
