/**
 * Permission scoping and authorization for agents
 */

import type { Permission, PermissionCapability, PermissionScope, Goal } from './types.js';
import { buildGoalMap, getAncestorIds, getDescendantIds } from './utils.js';

/**
 * Permission manager for controlling agent access
 */
export class PermissionManager {
  /**
   * Check if an agent has a specific capability on a goal
   */
  static hasCapability(
    agentId: string,
    capability: PermissionCapability,
    goal: Goal,
    permissions: Permission[]
  ): boolean {
    const agentPermission = permissions.find(p => p.agentId === agentId);
    if (!agentPermission) {
      return false;
    }

    if (!agentPermission.capabilities.includes(capability)) {
      return false;
    }

    // Check scope constraints
    if (agentPermission.scope) {
      return this.checkScope(goal.id, agentPermission.scope, goal, permissions);
    }

    return true;
  }

  /**
   * Check if a goal is within the permission scope
   */
  static checkScope(
    goalId: string,
    scope: PermissionScope,
    goal: Goal,
    permissions: Permission[]
  ): boolean {
    if (scope.goalIds && !scope.goalIds.includes(goalId)) {
      return false;
    }

    if (scope.domains && goal.domain && !scope.domains.includes(goal.domain)) {
      return false;
    }

    return true;
  }

  /**
   * Grant a permission to an agent
   */
  static grantPermission(
    agentId: string,
    capabilities: PermissionCapability[],
    scope?: PermissionScope,
    existing?: Permission[]
  ): Permission {
    return {
      agentId,
      capabilities,
      scope
    };
  }

  /**
   * Revoke all permissions for an agent
   */
  static revokeAllPermissions(agentId: string, permissions: Permission[]): Permission[] {
    return permissions.filter(p => p.agentId !== agentId);
  }

  /**
   * Revoke a specific capability
   */
  static revokeCapability(
    agentId: string,
    capability: PermissionCapability,
    permissions: Permission[]
  ): Permission[] {
    return permissions.map(p => {
      if (p.agentId === agentId) {
        return {
          ...p,
          capabilities: p.capabilities.filter(c => c !== capability)
        };
      }
      return p;
    });
  }

  /**
   * Add capabilities to existing permission
   */
  static addCapabilities(
    agentId: string,
    capabilities: PermissionCapability[],
    permissions: Permission[]
  ): Permission[] {
    return permissions.map(p => {
      if (p.agentId === agentId) {
        const newCapabilities = [...new Set([...p.capabilities, ...capabilities])];
        return {
          ...p,
          capabilities: newCapabilities
        };
      }
      return p;
    });
  }

  /**
   * Get all goals an agent can read
   */
  static getReadableGoals(agentId: string, goals: Goal[], globalPermissions: Permission[]): Goal[] {
    return goals.filter(goal => this.hasCapability(agentId, 'read', goal, globalPermissions));
  }

  /**
   * Get all goals an agent can modify
   */
  static getWritableGoals(agentId: string, goals: Goal[], globalPermissions: Permission[]): Goal[] {
    return goals.filter(goal => this.hasCapability(agentId, 'write', goal, globalPermissions));
  }

  /**
   * Get all goals an agent can complete
   */
  static getCompletableGoals(agentId: string, goals: Goal[], globalPermissions: Permission[]): Goal[] {
    return goals.filter(goal => this.hasCapability(agentId, 'complete', goal, globalPermissions));
  }

  /**
   * Check if agent can create sub-goals
   */
  static canCreateSubGoals(agentId: string, goal: Goal, globalPermissions: Permission[]): boolean {
    return this.hasCapability(agentId, 'create_sub_goals', goal, globalPermissions);
  }

  /**
   * Check if agent can reprioritize
   */
  static canReprioritize(agentId: string, goal: Goal, globalPermissions: Permission[]): boolean {
    return this.hasCapability(agentId, 'reprioritize', goal, globalPermissions);
  }

  /**
   * Validate permission structure
   */
  static validatePermission(permission: Permission): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!permission.agentId || permission.agentId.trim() === '') {
      errors.push('Agent ID is required');
    }

    if (!permission.capabilities || permission.capabilities.length === 0) {
      errors.push('At least one capability is required');
    }

    const validCapabilities: PermissionCapability[] = ['read', 'write', 'complete', 'create_sub_goals', 'reprioritize'];
    for (const cap of permission.capabilities) {
      if (!validCapabilities.includes(cap)) {
        errors.push(`Invalid capability: ${cap}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a permission with depth-limited scope
   */
  static createDepthLimitedPermission(
    agentId: string,
    capabilities: PermissionCapability[],
    maxDepth: number
  ): Permission {
    return {
      agentId,
      capabilities,
      scope: { maxDepth }
    };
  }

  /**
   * Create a domain-scoped permission
   */
  static createDomainScopedPermission(
    agentId: string,
    capabilities: PermissionCapability[],
    domains: string[]
  ): Permission {
    return {
      agentId,
      capabilities,
      scope: { domains }
    };
  }

  /**
   * Create a goal-specific permission
   */
  static createGoalScopedPermission(
    agentId: string,
    capabilities: PermissionCapability[],
    goalIds: string[]
  ): Permission {
    return {
      agentId,
      capabilities,
      scope: { goalIds }
    };
  }

  /**
   * Get all agents with a specific capability
   */
  static getAgentsWithCapability(
    capability: PermissionCapability,
    permissions: Permission[]
  ): string[] {
    return permissions
      .filter(p => p.capabilities.includes(capability))
      .map(p => p.agentId);
  }

  /**
   * Get all permissions for an agent
   */
  static getAgentPermissions(agentId: string, permissions: Permission[]): Permission | undefined {
    return permissions.find(p => p.agentId === agentId);
  }

  /**
   * Check if any agent has write access
   */
  static hasAnyWriter(permissions: Permission[]): boolean {
    return permissions.some(p => p.capabilities.includes('write'));
  }

  /**
   * Get summary of who can do what
   */
  static getSummary(permissions: Permission[]): Record<string, PermissionCapability[]> {
    const summary: Record<string, PermissionCapability[]> = {};
    for (const permission of permissions) {
      summary[permission.agentId] = permission.capabilities;
    }
    return summary;
  }
}
