import { describe, it, expect } from 'vitest';
import { PermissionManager } from '../src/permissions.js';
import { GoalClass } from '../src/goal.js';
import type { Permission } from '../src/types.js';

describe('PermissionManager', () => {
  const goal = GoalClass.create({
    title: 'Test Goal',
    status: 'active',
    priority: { level: 'medium' },
    domain: 'work'
  });

  it('should grant permissions', () => {
    const perm = PermissionManager.grantPermission('agent1', ['read', 'write']);
    expect(perm.agentId).toBe('agent1');
    expect(perm.capabilities).toContain('read');
    expect(perm.capabilities).toContain('write');
  });

  it('should check permissions', () => {
    const perms: Permission[] = [
      {
        agentId: 'agent1',
        capabilities: ['read', 'write']
      }
    ];

    const hasRead = PermissionManager.hasCapability('agent1', 'read', goal, perms);
    expect(hasRead).toBe(true);

    const hasComplete = PermissionManager.hasCapability('agent1', 'complete', goal, perms);
    expect(hasComplete).toBe(false);
  });

  it('should revoke all permissions', () => {
    const perms: Permission[] = [
      { agentId: 'agent1', capabilities: ['read'] },
      { agentId: 'agent2', capabilities: ['write'] }
    ];

    const remaining = PermissionManager.revokeAllPermissions('agent1', perms);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].agentId).toBe('agent2');
  });

  it('should revoke specific capability', () => {
    const perms: Permission[] = [
      { agentId: 'agent1', capabilities: ['read', 'write'] }
    ];

    const updated = PermissionManager.revokeCapability('agent1', 'write', perms);
    expect(updated[0].capabilities).toContain('read');
    expect(updated[0].capabilities).not.toContain('write');
  });

  it('should add capabilities', () => {
    const perms: Permission[] = [
      { agentId: 'agent1', capabilities: ['read'] }
    ];

    const updated = PermissionManager.addCapabilities('agent1', ['write', 'complete'], perms);
    expect(updated[0].capabilities).toContain('read');
    expect(updated[0].capabilities).toContain('write');
    expect(updated[0].capabilities).toContain('complete');
  });

  it('should get readable goals', () => {
    const perms: Permission[] = [
      { agentId: 'agent1', capabilities: ['read'] }
    ];

    const readable = PermissionManager.getReadableGoals('agent1', [goal], perms);
    expect(readable).toHaveLength(1);
  });

  it('should get writable goals', () => {
    const perms: Permission[] = [
      { agentId: 'agent1', capabilities: ['write'] }
    ];

    const writable = PermissionManager.getWritableGoals('agent1', [goal], perms);
    expect(writable).toHaveLength(1);
  });

  it('should get completable goals', () => {
    const perms: Permission[] = [
      { agentId: 'agent1', capabilities: ['complete'] }
    ];

    const completable = PermissionManager.getCompletableGoals('agent1', [goal], perms);
    expect(completable).toHaveLength(1);
  });

  it('should check sub-goal creation permission', () => {
    const perms: Permission[] = [
      { agentId: 'agent1', capabilities: ['create_sub_goals'] }
    ];

    const canCreate = PermissionManager.canCreateSubGoals('agent1', goal, perms);
    expect(canCreate).toBe(true);
  });

  it('should check reprioritize permission', () => {
    const perms: Permission[] = [
      { agentId: 'agent1', capabilities: ['reprioritize'] }
    ];

    const canReprioritize = PermissionManager.canReprioritize('agent1', goal, perms);
    expect(canReprioritize).toBe(true);
  });

  it('should validate permissions', () => {
    const validPerm: Permission = {
      agentId: 'agent1',
      capabilities: ['read', 'write']
    };

    const result = PermissionManager.validatePermission(validPerm);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid permissions', () => {
    const invalidPerm: Permission = {
      agentId: '',
      capabilities: ['read']
    };

    const result = PermissionManager.validatePermission(invalidPerm);
    expect(result.valid).toBe(false);
  });

  it('should create depth-limited permission', () => {
    const perm = PermissionManager.createDepthLimitedPermission('agent1', ['read', 'write'], 2);
    expect(perm.scope?.maxDepth).toBe(2);
  });

  it('should create domain-scoped permission', () => {
    const perm = PermissionManager.createDomainScopedPermission('agent1', ['read'], ['work', 'personal']);
    expect(perm.scope?.domains).toContain('work');
    expect(perm.scope?.domains).toContain('personal');
  });

  it('should create goal-specific permission', () => {
    const perm = PermissionManager.createGoalScopedPermission('agent1', ['read'], ['goal_1', 'goal_2']);
    expect(perm.scope?.goalIds).toContain('goal_1');
    expect(perm.scope?.goalIds).toContain('goal_2');
  });

  it('should get agents with capability', () => {
    const perms: Permission[] = [
      { agentId: 'agent1', capabilities: ['read'] },
      { agentId: 'agent2', capabilities: ['read', 'write'] },
      { agentId: 'agent3', capabilities: ['write'] }
    ];

    const readers = PermissionManager.getAgentsWithCapability('read', perms);
    expect(readers).toContain('agent1');
    expect(readers).toContain('agent2');
    expect(readers).not.toContain('agent3');
  });

  it('should get agent permissions', () => {
    const perms: Permission[] = [
      { agentId: 'agent1', capabilities: ['read', 'write'] },
      { agentId: 'agent2', capabilities: ['write'] }
    ];

    const agent1Perms = PermissionManager.getAgentPermissions('agent1', perms);
    expect(agent1Perms?.agentId).toBe('agent1');
    expect(agent1Perms?.capabilities).toContain('read');
  });

  it('should check if any writer exists', () => {
    const perms: Permission[] = [
      { agentId: 'agent1', capabilities: ['read'] }
    ];

    expect(PermissionManager.hasAnyWriter(perms)).toBe(false);

    const permsWithWriter: Permission[] = [
      { agentId: 'agent1', capabilities: ['read'] },
      { agentId: 'agent2', capabilities: ['write'] }
    ];

    expect(PermissionManager.hasAnyWriter(permsWithWriter)).toBe(true);
  });

  it('should get summary of permissions', () => {
    const perms: Permission[] = [
      { agentId: 'agent1', capabilities: ['read', 'write'] },
      { agentId: 'agent2', capabilities: ['complete'] }
    ];

    const summary = PermissionManager.getSummary(perms);
    expect(summary.agent1).toContain('read');
    expect(summary.agent2).toContain('complete');
  });

  it('should handle scope constraints', () => {
    const perms: Permission[] = [
      {
        agentId: 'agent1',
        capabilities: ['read'],
        scope: { domains: ['work'] }
      }
    ];

    const workGoal = GoalClass.create({
      title: 'Work Task',
      status: 'active',
      priority: { level: 'medium' },
      domain: 'work'
    });

    const personalGoal = GoalClass.create({
      title: 'Personal Task',
      status: 'active',
      priority: { level: 'medium' },
      domain: 'personal'
    });

    expect(PermissionManager.hasCapability('agent1', 'read', workGoal, perms)).toBe(true);
    expect(PermissionManager.hasCapability('agent1', 'read', personalGoal, perms)).toBe(false);
  });

  it('should handle all capability types', () => {
    const capabilities = ['read', 'write', 'complete', 'create_sub_goals', 'reprioritize'] as const;

    for (const cap of capabilities) {
      const perm = PermissionManager.grantPermission('agent1', [cap]);
      expect(perm.capabilities).toContain(cap);
    }
  });
});
