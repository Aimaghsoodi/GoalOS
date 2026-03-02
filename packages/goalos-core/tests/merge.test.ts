import { describe, it, expect } from 'vitest';
import { MergeEngine } from '../src/merge.js';
import { IntentGraphClass } from '../src/intent-graph.js';

describe('MergeEngine', () => {
  it('should merge two graphs', () => {
    const graph1 = IntentGraphClass.create('user1');
    const goal1 = graph1.addGoal({
      title: 'Goal 1',
      status: 'active',
      priority: { level: 'medium' }
    });

    const graph2 = IntentGraphClass.create('user1');
    const goal2 = graph2.addGoal({
      title: 'Goal 2',
      status: 'active',
      priority: { level: 'medium' }
    });

    const result = MergeEngine.merge(graph1.toJSON(), graph2.toJSON(), 'latest_wins');
    expect(result.merged.goals.length).toBeGreaterThanOrEqual(1);
  });

  it('should detect added goals', () => {
    const graph1 = IntentGraphClass.create('user1');
    const goal1 = graph1.addGoal({
      title: 'Goal 1',
      status: 'active',
      priority: { level: 'medium' }
    });

    const graph2 = IntentGraphClass.create('user1');
    const goal2 = graph2.addGoal({
      title: 'Goal 1',
      status: 'active',
      priority: { level: 'medium' },
      id: goal1.id
    });

    const goal3 = graph2.addGoal({
      title: 'Goal 2 - New',
      status: 'active',
      priority: { level: 'medium' }
    });

    const result = MergeEngine.merge(graph1.toJSON(), graph2.toJSON(), 'latest_wins');
    expect(result.added.length).toBeGreaterThan(0);
  });

  it('should detect removed goals', () => {
    const graph1 = IntentGraphClass.create('user1');
    const goal1 = graph1.addGoal({
      title: 'Goal 1',
      status: 'active',
      priority: { level: 'medium' }
    });

    const goal2 = graph1.addGoal({
      title: 'Goal 2',
      status: 'active',
      priority: { level: 'medium' }
    });

    const graph2 = IntentGraphClass.create('user1');
    const sameGoal1 = graph2.addGoal({
      title: 'Goal 1',
      status: 'active',
      priority: { level: 'medium' },
      id: goal1.id
    });

    const result = MergeEngine.merge(graph1.toJSON(), graph2.toJSON(), 'latest_wins');
    expect(result.removed.map(g => g.id)).toContain(goal2.id);
  });

  it('should use latest wins strategy', () => {
    const graph1 = IntentGraphClass.create('user1');
    const goal1 = graph1.addGoal({
      title: 'Original Title',
      status: 'active',
      priority: { level: 'medium' }
    });

    const graph2 = IntentGraphClass.create('user1');
    graph2.addGoal({
      id: goal1.id,
      title: 'Updated Title',
      status: 'completed',
      priority: { level: 'high' },
      createdAt: goal1.createdAt,
      updatedAt: new Date(Date.now() + 1000).toISOString(),
      version: 1
    });

    const result = MergeEngine.merge(graph1.toJSON(), graph2.toJSON(), 'latest_wins');
    const merged = result.merged.goals.find(g => g.id === goal1.id);
    expect(merged?.title).toBe('Updated Title');
  });

  it('should use most restrictive strategy', () => {
    const graph1 = IntentGraphClass.create('user1');
    const goal1 = graph1.addGoal({
      title: 'Goal',
      status: 'active',
      priority: { level: 'low' },
      deadline: '2025-12-31T23:59:59Z'
    });

    const graph2 = IntentGraphClass.create('user1');
    graph2.addGoal({
      id: goal1.id,
      title: 'Goal',
      status: 'active',
      priority: { level: 'high' },
      deadline: '2025-06-30T23:59:59Z',
      createdAt: goal1.createdAt,
      updatedAt: goal1.updatedAt,
      version: 1
    });

    const result = MergeEngine.merge(goal1, graph2.toJSON().goals[0], 'most_restrictive');
    const merged = result.merged.goals.find(g => g.id === goal1.id);

    // Should have earlier deadline and higher priority
    expect(merged?.deadline).toBe('2025-06-30T23:59:59Z');
    expect(merged?.priority.level).toBe('high');
  });

  it('should detect conflicts', () => {
    const graph1 = IntentGraphClass.create('user1');
    const goal1 = graph1.addGoal({
      title: 'Title A',
      status: 'active',
      priority: { level: 'medium' }
    });

    const graph2 = IntentGraphClass.create('user1');
    graph2.addGoal({
      id: goal1.id,
      title: 'Title B',
      status: 'completed',
      priority: { level: 'high' },
      createdAt: goal1.createdAt,
      updatedAt: goal1.updatedAt,
      version: 1
    });

    const result = MergeEngine.merge(graph1.toJSON(), graph2.toJSON(), 'manual');
    expect(result.conflicts.length).toBeGreaterThan(0);
  });

  it('should get conflict summary', () => {
    const graph1 = IntentGraphClass.create('user1');
    const goal1 = graph1.addGoal({
      title: 'Title A',
      status: 'active',
      priority: { level: 'medium' }
    });

    const graph2 = IntentGraphClass.create('user1');
    graph2.addGoal({
      id: goal1.id,
      title: 'Title B',
      status: 'completed',
      priority: { level: 'high' },
      createdAt: goal1.createdAt,
      updatedAt: goal1.updatedAt,
      version: 1
    });

    const result = MergeEngine.merge(graph1.toJSON(), graph2.toJSON(), 'manual');
    const summary = MergeEngine.getConflictingSummary(result);
    expect(summary).toContain(goal1.id);
  });

  it('should check for conflicts', () => {
    const graph1 = IntentGraphClass.create('user1');
    graph1.addGoal({
      title: 'Goal',
      status: 'active',
      priority: { level: 'medium' }
    });

    const graph2 = IntentGraphClass.create('user1');
    graph2.addGoal({
      title: 'Goal',
      status: 'active',
      priority: { level: 'medium' }
    });

    const result = MergeEngine.merge(graph1.toJSON(), graph2.toJSON(), 'latest_wins');
    expect(MergeEngine.hasConflicts(result)).toBe(false);
  });

  it('should get merge summary', () => {
    const graph1 = IntentGraphClass.create('user1');
    graph1.addGoal({
      title: 'Goal',
      status: 'active',
      priority: { level: 'medium' }
    });

    const graph2 = IntentGraphClass.create('user1');
    graph2.addGoal({
      title: 'New Goal',
      status: 'active',
      priority: { level: 'medium' }
    });

    const result = MergeEngine.merge(graph1.toJSON(), graph2.toJSON());
    const summary = MergeEngine.getSummary(result);

    expect(summary).toContain('Added:');
    expect(summary).toContain('Merged goals:');
  });

  it('should handle three-way merge', () => {
    const ancestor = IntentGraphClass.create('user1');
    const ancestorGoal = ancestor.addGoal({
      title: 'Original',
      status: 'active',
      priority: { level: 'medium' }
    });

    const local = IntentGraphClass.create('user1');
    local.addGoal({
      id: ancestorGoal.id,
      title: 'Local Version',
      status: 'active',
      priority: { level: 'high' },
      createdAt: ancestorGoal.createdAt,
      updatedAt: ancestorGoal.updatedAt,
      version: 1
    });

    const remote = IntentGraphClass.create('user1');
    remote.addGoal({
      id: ancestorGoal.id,
      title: 'Remote Version',
      status: 'completed',
      priority: { level: 'low' },
      createdAt: ancestorGoal.createdAt,
      updatedAt: ancestorGoal.updatedAt,
      version: 1
    });

    const result = MergeEngine.threeWayMerge(ancestor.toJSON(), local.toJSON(), remote.toJSON());
    expect(result.conflicts.length).toBeGreaterThan(0);
  });

  it('should merge without conflicts when only one side changes', () => {
    const ancestor = IntentGraphClass.create('user1');
    const ancestorGoal = ancestor.addGoal({
      title: 'Original',
      status: 'active',
      priority: { level: 'medium' }
    });

    const local = IntentGraphClass.create('user1');
    local.addGoal({
      id: ancestorGoal.id,
      title: 'Updated Title',
      status: 'active',
      priority: { level: 'medium' },
      createdAt: ancestorGoal.createdAt,
      updatedAt: new Date(Date.now() + 1000).toISOString(),
      version: 1
    });

    const remote = IntentGraphClass.create('user1');
    remote.addGoal({
      id: ancestorGoal.id,
      title: 'Original',
      status: 'active',
      priority: { level: 'medium' },
      createdAt: ancestorGoal.createdAt,
      updatedAt: ancestorGoal.updatedAt,
      version: 1
    });

    const result = MergeEngine.threeWayMerge(ancestor.toJSON(), local.toJSON(), remote.toJSON());
    expect(result.conflicts.length).toBe(0);
  });
});
