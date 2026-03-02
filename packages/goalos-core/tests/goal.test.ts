import { describe, it, expect, beforeEach } from 'vitest';
import { GoalClass } from '../src/goal.js';
import type { Goal } from '../src/types.js';

describe('GoalClass', () => {
  let goal: Goal;

  beforeEach(() => {
    goal = GoalClass.create({
      title: 'Test Goal',
      status: 'planned',
      priority: { level: 'medium' }
    });
  });

  it('should create a goal with required fields', () => {
    expect(goal.id).toBeDefined();
    expect(goal.id).toMatch(/^goal_/);
    expect(goal.title).toBe('Test Goal');
    expect(goal.status).toBe('planned');
    expect(goal.priority.level).toBe('medium');
    expect(goal.createdAt).toBeDefined();
    expect(goal.updatedAt).toBeDefined();
    expect(goal.version).toBe(1);
  });

  it('should create goal with optional fields', () => {
    const detailed = GoalClass.create({
      title: 'Detailed Goal',
      status: 'active',
      priority: { level: 'high', reason: 'Important' },
      description: 'A detailed description',
      domain: 'work',
      tags: ['test', 'urgent'],
      deadline: '2025-12-31T23:59:59Z',
      successCriteria: ['Criterion 1', 'Criterion 2'],
      motivation: 'To achieve success'
    });

    expect(detailed.description).toBe('A detailed description');
    expect(detailed.domain).toBe('work');
    expect(detailed.tags).toEqual(['test', 'urgent']);
    expect(detailed.deadline).toBe('2025-12-31T23:59:59Z');
    expect(detailed.successCriteria).toHaveLength(2);
    expect(detailed.motivation).toBe('To achieve success');
  });

  it('should update a goal', () => {
    const updated = GoalClass.update(goal, {
      title: 'Updated Title',
      status: 'active'
    });

    expect(updated.title).toBe('Updated Title');
    expect(updated.status).toBe('active');
    expect(updated.version).toBe(2);
    expect(updated.id).toBe(goal.id);
    expect(updated.createdAt).toBe(goal.createdAt);
  });

  it('should complete a goal', () => {
    const completed = GoalClass.complete(goal);

    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
  });

  it('should abandon a goal', () => {
    const abandoned = GoalClass.abandon(goal, 'No longer needed');

    expect(abandoned.status).toBe('abandoned');
    expect(abandoned.completedAt).toBeDefined();
    expect(abandoned.metadata?.abandonReason).toBe('No longer needed');
  });

  it('should block a goal', () => {
    const blocked = GoalClass.block(goal, 'waiting-for-approval');

    expect(blocked.status).toBe('blocked');
    expect(blocked.metadata?.blockedBy).toBe('waiting-for-approval');
  });

  it('should unblock a goal', () => {
    const blocked = GoalClass.block(goal);
    const unblocked = GoalClass.unblock(blocked);

    expect(unblocked.status).toBe('active');
  });

  it('should pause and resume a goal', () => {
    const paused = GoalClass.pause(goal);
    expect(paused.status).toBe('paused');

    const resumed = GoalClass.resume(paused);
    expect(resumed.status).toBe('active');
  });

  it('should add and remove dependencies', () => {
    let goal1 = GoalClass.create({ title: 'Goal 1', status: 'active', priority: { level: 'medium' } });
    let goal2 = GoalClass.create({ title: 'Goal 2', status: 'active', priority: { level: 'medium' } });

    const dep = { type: 'requires' as const, targetGoalId: goal2.id, description: 'Needs goal 2' };
    goal1 = GoalClass.addDependency(goal1, dep);

    expect(goal1.dependencies).toHaveLength(1);
    expect(goal1.dependencies?.[0].targetGoalId).toBe(goal2.id);

    goal1 = GoalClass.removeDependency(goal1, goal2.id);
    expect(goal1.dependencies).toHaveLength(0);
  });

  it('should add and remove permissions', () => {
    const perm = { agentId: 'agent1', capabilities: ['read', 'write'] as const };
    let updated = GoalClass.addPermission(goal, perm);

    expect(updated.permissions).toHaveLength(1);
    expect(updated.permissions?.[0].agentId).toBe('agent1');

    updated = GoalClass.removePermission(updated, 'agent1');
    expect(updated.permissions).toHaveLength(0);
  });

  it('should set priority', () => {
    const newPriority = { level: 'critical' as const, reason: 'Urgent' };
    const updated = GoalClass.setPriority(goal, newPriority);

    expect(updated.priority.level).toBe('critical');
    expect(updated.priority.reason).toBe('Urgent');
  });

  it('should detect overdue goals', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);

    const overdueGoal = GoalClass.create({
      title: 'Overdue',
      status: 'active',
      priority: { level: 'medium' },
      deadline: past.toISOString()
    });

    expect(GoalClass.isOverdue(overdueGoal)).toBe(true);
    expect(GoalClass.isOverdue(goal)).toBe(false);
  });

  it('should calculate days until deadline', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);

    const futureGoal = GoalClass.create({
      title: 'Future',
      status: 'active',
      priority: { level: 'medium' },
      deadline: future.toISOString()
    });

    const days = GoalClass.daysUntilDeadline(futureGoal);
    expect(days).toBeBeDefined();
    expect(days).toBeGreaterThanOrEqual(4);
  });

  it('should serialize and deserialize goals', () => {
    const json = GoalClass.toJSON(goal);
    const parsed = GoalClass.fromJSON(json);

    expect(parsed.id).toBe(goal.id);
    expect(parsed.title).toBe(goal.title);
    expect(parsed.status).toBe(goal.status);
  });

  it('should validate goal structure', () => {
    expect(goal.title).toBeDefined();
    expect(goal.status).toBeDefined();
    expect(goal.priority).toBeDefined();
    expect(goal.createdAt).toBeDefined();
    expect(goal.updatedAt).toBeDefined();
    expect(goal.version).toBe(1);
  });

  it('should throw on invalid goal creation', () => {
    expect(() => {
      GoalClass.create({
        title: '',
        status: 'active',
        priority: { level: 'medium' }
      });
    }).toThrow();
  });

  it('should check goal completeness', () => {
    const incomplete = GoalClass.create({
      title: 'Incomplete',
      status: 'active',
      priority: { level: 'medium' }
    });

    expect(GoalClass.isComplete(incomplete)).toBe(false);

    const complete = GoalClass.create({
      title: 'Complete',
      status: 'active',
      priority: { level: 'medium' },
      deadline: '2025-12-31T23:59:59Z',
      successCriteria: ['Done']
    });

    expect(GoalClass.isComplete(complete)).toBe(true);
  });

  it('should handle all priority levels', () => {
    const levels = ['critical', 'high', 'medium', 'low', 'someday'] as const;

    for (const level of levels) {
      const g = GoalClass.create({
        title: `${level} goal`,
        status: 'active',
        priority: { level }
      });
      expect(g.priority.level).toBe(level);
    }
  });

  it('should handle all goal statuses', () => {
    const statuses = ['active', 'planned', 'blocked', 'paused', 'completed', 'abandoned'] as const;

    for (const status of statuses) {
      const g = GoalClass.create({
        title: `${status} goal`,
        status,
        priority: { level: 'medium' }
      });
      expect(g.status).toBe(status);
    }
  });

  it('should preserve metadata', () => {
    const g = GoalClass.create({
      title: 'With metadata',
      status: 'active',
      priority: { level: 'medium' },
      metadata: { custom: 'value', number: 42 }
    });

    expect(g.metadata?.custom).toBe('value');
    expect(g.metadata?.number).toBe(42);
  });
});
