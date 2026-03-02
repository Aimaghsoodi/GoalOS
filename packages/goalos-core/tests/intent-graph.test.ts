import { describe, it, expect, beforeEach } from 'vitest';
import { IntentGraphClass } from '../src/intent-graph.js';
import { GoalClass } from '../src/goal.js';

describe('IntentGraphClass', () => {
  let graph: IntentGraphClass;

  beforeEach(() => {
    graph = IntentGraphClass.create('user_123', 'Test Graph');
  });

  it('should create an empty intent graph', () => {
    expect(graph.toJSON().id).toBeDefined();
    expect(graph.toJSON().version).toBe('0.1.0');
    expect(graph.toJSON().owner).toBe('user_123');
    expect(graph.toJSON().name).toBe('Test Graph');
    expect(graph.toJSON().goals).toHaveLength(0);
  });

  it('should add goals to graph', () => {
    const goal = graph.addGoal({
      title: 'First Goal',
      status: 'active',
      priority: { level: 'high' }
    });

    expect(goal.id).toBeDefined();
    expect(graph.toJSON().goals).toHaveLength(1);
  });

  it('should retrieve goals by ID', () => {
    const goal = graph.addGoal({
      title: 'Test Goal',
      status: 'active',
      priority: { level: 'medium' }
    });

    const retrieved = graph.getGoal(goal.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Test Goal');
  });

  it('should update goals', () => {
    const goal = graph.addGoal({
      title: 'Original Title',
      status: 'active',
      priority: { level: 'medium' }
    });

    const updated = graph.updateGoal(goal.id, { title: 'Updated Title' });
    expect(updated.title).toBe('Updated Title');
  });

  it('should remove goals', () => {
    const goal = graph.addGoal({
      title: 'To Delete',
      status: 'active',
      priority: { level: 'medium' }
    });

    expect(graph.toJSON().goals).toHaveLength(1);
    graph.removeGoal(goal.id);
    expect(graph.toJSON().goals).toHaveLength(0);
  });

  it('should complete goals', () => {
    const goal = graph.addGoal({
      title: 'Completable',
      status: 'active',
      priority: { level: 'medium' }
    });

    const completed = graph.completeGoal(goal.id);
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
  });

  it('should abandon goals', () => {
    const goal = graph.addGoal({
      title: 'Abandonable',
      status: 'active',
      priority: { level: 'medium' }
    });

    const abandoned = graph.abandonGoal(goal.id, 'Not needed');
    expect(abandoned.status).toBe('abandoned');
  });

  it('should block and unblock goals', () => {
    const goal = graph.addGoal({
      title: 'Blockable',
      status: 'active',
      priority: { level: 'medium' }
    });

    const blocked = graph.blockGoal(goal.id, 'waiting');
    expect(blocked.status).toBe('blocked');

    const unblocked = graph.unblockGoal(goal.id);
    expect(unblocked.status).toBe('active');
  });

  it('should handle goal hierarchies', () => {
    const parent = graph.addGoal({
      title: 'Parent Goal',
      status: 'active',
      priority: { level: 'high' }
    });

    const child1 = graph.addGoal({
      title: 'Child 1',
      parentId: parent.id,
      status: 'active',
      priority: { level: 'medium' }
    });

    const child2 = graph.addGoal({
      title: 'Child 2',
      parentId: parent.id,
      status: 'active',
      priority: { level: 'medium' }
    });

    const children = graph.getChildren(parent.id);
    expect(children).toHaveLength(2);
    expect(children.map(c => c.id)).toContain(child1.id);
    expect(children.map(c => c.id)).toContain(child2.id);
  });

  it('should get descendants', () => {
    const root = graph.addGoal({
      title: 'Root',
      status: 'active',
      priority: { level: 'high' }
    });

    const child = graph.addGoal({
      title: 'Child',
      parentId: root.id,
      status: 'active',
      priority: { level: 'medium' }
    });

    const grandchild = graph.addGoal({
      title: 'Grandchild',
      parentId: child.id,
      status: 'active',
      priority: { level: 'medium' }
    });

    const descendants = graph.getDescendants(root.id);
    expect(descendants).toHaveLength(2);
    expect(descendants.map(d => d.id)).toContain(child.id);
    expect(descendants.map(d => d.id)).toContain(grandchild.id);
  });

  it('should get root goals', () => {
    const root1 = graph.addGoal({
      title: 'Root 1',
      status: 'active',
      priority: { level: 'high' }
    });

    const child = graph.addGoal({
      title: 'Child',
      parentId: root1.id,
      status: 'active',
      priority: { level: 'medium' }
    });

    const root2 = graph.addGoal({
      title: 'Root 2',
      status: 'active',
      priority: { level: 'high' }
    });

    const roots = graph.getRootGoals();
    expect(roots).toHaveLength(2);
    expect(roots.map(r => r.id)).toContain(root1.id);
    expect(roots.map(r => r.id)).toContain(root2.id);
  });

  it('should handle dependencies without cycles', () => {
    const goal1 = graph.addGoal({
      title: 'Goal 1',
      status: 'active',
      priority: { level: 'medium' }
    });

    const goal2 = graph.addGoal({
      title: 'Goal 2',
      status: 'active',
      priority: { level: 'medium' }
    });

    graph.addDependency(goal2.id, {
      type: 'requires',
      targetGoalId: goal1.id
    });

    const blockers = graph.getBlockers(goal2.id);
    expect(blockers.map(b => b.id)).toContain(goal1.id);
  });

  it('should detect circular dependencies', () => {
    const goal1 = graph.addGoal({
      title: 'Goal 1',
      status: 'active',
      priority: { level: 'medium' }
    });

    const goal2 = graph.addGoal({
      title: 'Goal 2',
      status: 'active',
      priority: { level: 'medium' }
    });

    graph.addDependency(goal1.id, {
      type: 'requires',
      targetGoalId: goal2.id
    });

    expect(() => {
      graph.addDependency(goal2.id, {
        type: 'requires',
        targetGoalId: goal1.id
      });
    }).toThrow();
  });

  it('should get top priorities', () => {
    graph.addGoal({
      title: 'Critical',
      status: 'active',
      priority: { level: 'critical' }
    });

    graph.addGoal({
      title: 'High',
      status: 'active',
      priority: { level: 'high' }
    });

    graph.addGoal({
      title: 'Low',
      status: 'active',
      priority: { level: 'low' }
    });

    const top = graph.getTopPriorities(2);
    expect(top).toHaveLength(2);
    expect(top[0].priority.level).toBe('critical');
  });

  it('should filter by status', () => {
    graph.addGoal({
      title: 'Active',
      status: 'active',
      priority: { level: 'medium' }
    });

    graph.addGoal({
      title: 'Completed',
      status: 'completed',
      priority: { level: 'medium' }
    });

    const active = graph.getByStatus('active');
    expect(active).toHaveLength(1);
    expect(active[0].title).toBe('Active');
  });

  it('should query with complex filters', () => {
    graph.addGoal({
      title: 'Work Task',
      status: 'active',
      priority: { level: 'high' },
      domain: 'work',
      tags: ['urgent']
    });

    graph.addGoal({
      title: 'Personal Task',
      status: 'active',
      priority: { level: 'low' },
      domain: 'personal',
      tags: ['someday']
    });

    const results = graph.query({
      domain: 'work',
      priority: 'high'
    });

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Work Task');
  });

  it('should get goal tree', () => {
    const root = graph.addGoal({
      title: 'Root',
      status: 'active',
      priority: { level: 'high' }
    });

    graph.addGoal({
      title: 'Child',
      parentId: root.id,
      status: 'active',
      priority: { level: 'medium' }
    });

    const tree = graph.getTree();
    expect(tree).toHaveLength(1);
    expect(tree[0].goal.id).toBe(root.id);
    expect(tree[0].children).toHaveLength(1);
  });

  it('should validate the graph', () => {
    graph.addGoal({
      title: 'Valid Goal',
      status: 'active',
      priority: { level: 'medium' }
    });

    const result = graph.validate();
    expect(result.valid).toBe(true);
  });

  it('should get statistics', () => {
    graph.addGoal({
      title: 'Active Goal',
      status: 'active',
      priority: { level: 'high' },
      domain: 'work'
    });

    graph.addGoal({
      title: 'Completed Goal',
      status: 'completed',
      priority: { level: 'medium' },
      domain: 'personal'
    });

    const stats = graph.getStats();
    expect(stats.totalGoals).toBe(2);
    expect(stats.byStatus.active).toBe(1);
    expect(stats.byStatus.completed).toBe(1);
    expect(stats.byDomain.work).toBe(1);
    expect(stats.byDomain.personal).toBe(1);
  });

  it('should calculate completion rate', () => {
    graph.addGoal({
      title: 'Active',
      status: 'active',
      priority: { level: 'medium' }
    });

    graph.addGoal({
      title: 'Completed',
      status: 'completed',
      priority: { level: 'medium' }
    });

    const rate = graph.getCompletionRate();
    expect(rate).toBeCloseTo(0.5, 1);
  });

  it('should serialize to JSON', () => {
    graph.addGoal({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const json = graph.toString();
    expect(json).toBeDefined();
    expect(typeof json).toBe('string');

    const reparsed = IntentGraphClass.fromJSON(json);
    expect(reparsed.toJSON().goals).toHaveLength(1);
  });

  it('should move goals between parents', () => {
    const parent1 = graph.addGoal({
      title: 'Parent 1',
      status: 'active',
      priority: { level: 'high' }
    });

    const parent2 = graph.addGoal({
      title: 'Parent 2',
      status: 'active',
      priority: { level: 'high' }
    });

    const child = graph.addGoal({
      title: 'Child',
      parentId: parent1.id,
      status: 'active',
      priority: { level: 'medium' }
    });

    graph.moveGoal(child.id, parent2.id);

    const updatedChild = graph.getGoal(child.id);
    expect(updatedChild?.parentId).toBe(parent2.id);
  });

  it('should handle event listeners', () => {
    let eventFired = false;

    graph.on('goal.created', () => {
      eventFired = true;
    });

    graph.addGoal({
      title: 'Event Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    expect(eventFired).toBe(true);
  });

  it('should track goal history', () => {
    const goal = graph.addGoal({
      title: 'History Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    graph.updateGoal(goal.id, { title: 'Updated' });

    const history = graph.getHistory(goal.id);
    expect(history.length).toBeGreaterThan(0);
  });

  it('should merge graphs', () => {
    const graph1 = IntentGraphClass.create('user1', 'Graph 1');
    const goal1 = graph1.addGoal({
      title: 'Goal 1',
      status: 'active',
      priority: { level: 'medium' }
    });

    const graph2 = IntentGraphClass.create('user1', 'Graph 2');
    const goal2 = graph2.addGoal({
      title: 'Goal 2',
      status: 'active',
      priority: { level: 'medium' }
    });

    const result = graph1.merge(graph2);
    expect(result.merged.goals.length).toBeGreaterThanOrEqual(1);
  });

  it('should get progress of a goal', () => {
    const parent = graph.addGoal({
      title: 'Parent',
      status: 'active',
      priority: { level: 'high' }
    });

    graph.addGoal({
      title: 'Child 1',
      parentId: parent.id,
      status: 'completed',
      priority: { level: 'medium' }
    });

    graph.addGoal({
      title: 'Child 2',
      parentId: parent.id,
      status: 'active',
      priority: { level: 'medium' }
    });

    const progress = graph.getProgress(parent.id);
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThanOrEqual(1);
  });
});
