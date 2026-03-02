import { describe, it, expect } from 'vitest';
import { QueryEngine } from '../src/query.js';
import { GoalClass } from '../src/goal.js';
import type { Goal } from '../src/types.js';

describe('QueryEngine', () => {
  let goals: Goal[];

  function createTestGoals() {
    goals = [
      GoalClass.create({
        title: 'Active Work',
        status: 'active',
        priority: { level: 'high' },
        domain: 'work',
        tags: ['urgent', 'project']
      }),
      GoalClass.create({
        title: 'Personal Goal',
        status: 'planned',
        priority: { level: 'low' },
        domain: 'personal',
        tags: ['health']
      }),
      GoalClass.create({
        title: 'Completed Task',
        status: 'completed',
        priority: { level: 'medium' },
        domain: 'work'
      }),
      GoalClass.create({
        title: 'Blocked Goal',
        status: 'blocked',
        priority: { level: 'critical' },
        domain: 'work'
      })
    ];
  }

  it('should query goals with filter', () => {
    createTestGoals();
    const result = QueryEngine.query(goals, { status: 'active' });
    expect(result.goals).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should filter by status', () => {
    createTestGoals();
    const active = QueryEngine.byStatus(goals, 'active');
    expect(active).toHaveLength(1);
  });

  it('should filter by multiple statuses', () => {
    createTestGoals();
    const statuses = QueryEngine.byStatus(goals, ['active', 'planned']);
    expect(statuses).toHaveLength(2);
  });

  it('should filter by priority', () => {
    createTestGoals();
    const high = QueryEngine.byPriority(goals, 'high');
    expect(high).toHaveLength(1);
  });

  it('should filter by domain', () => {
    createTestGoals();
    const work = QueryEngine.byDomain(goals, 'work');
    expect(work.length).toBeGreaterThan(0);
  });

  it('should filter by tag', () => {
    createTestGoals();
    const tagged = QueryEngine.byTag(goals, 'urgent');
    expect(tagged.length).toBeGreaterThan(0);
  });

  it('should get goals with deadline', () => {
    createTestGoals();
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const deadline = future.toISOString();

    const goal = GoalClass.create({
      title: 'With deadline',
      status: 'active',
      priority: { level: 'medium' },
      deadline
    });

    goals.push(goal);

    const withDeadline = QueryEngine.withDeadline(goals);
    expect(withDeadline.length).toBeGreaterThan(0);
  });

  it('should get overdue goals', () => {
    createTestGoals();
    const past = new Date();
    past.setDate(past.getDate() - 1);

    const overdue = GoalClass.create({
      title: 'Overdue',
      status: 'active',
      priority: { level: 'medium' },
      deadline: past.toISOString()
    });

    goals.push(overdue);

    const overdueGoals = QueryEngine.overdue(goals);
    expect(overdueGoals.length).toBeGreaterThan(0);
  });

  it('should get active goals', () => {
    createTestGoals();
    const active = QueryEngine.active(goals);
    expect(active).toHaveLength(1);
  });

  it('should get completed goals', () => {
    createTestGoals();
    const completed = QueryEngine.completed(goals);
    expect(completed).toHaveLength(1);
  });

  it('should get blocked goals', () => {
    createTestGoals();
    const blocked = QueryEngine.blocked(goals);
    expect(blocked).toHaveLength(1);
  });

  it('should search by text', () => {
    createTestGoals();
    const results = QueryEngine.search(goals, 'Active');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should get children of a goal', () => {
    createTestGoals();
    const parent = GoalClass.create({
      title: 'Parent',
      status: 'active',
      priority: { level: 'medium' }
    });

    const child = GoalClass.create({
      title: 'Child',
      parentId: parent.id,
      status: 'active',
      priority: { level: 'medium' }
    });

    const allGoals = [...goals, parent, child];
    const children = QueryEngine.children(allGoals, parent.id);
    expect(children).toHaveLength(1);
    expect(children[0].id).toBe(child.id);
  });

  it('should get descendants of a goal', () => {
    const parent = GoalClass.create({
      title: 'Parent',
      status: 'active',
      priority: { level: 'medium' }
    });

    const child = GoalClass.create({
      title: 'Child',
      parentId: parent.id,
      status: 'active',
      priority: { level: 'medium' }
    });

    const grandchild = GoalClass.create({
      title: 'Grandchild',
      parentId: child.id,
      status: 'active',
      priority: { level: 'medium' }
    });

    goals = [parent, child, grandchild];
    const descendants = QueryEngine.descendants(goals, parent.id);
    expect(descendants).toHaveLength(2);
  });

  it('should get root goals', () => {
    createTestGoals();
    const roots = QueryEngine.roots(goals);
    expect(roots.length).toBeGreaterThan(0);
    roots.forEach(g => expect(g.parentId).toBeFalsy());
  });

  it('should get leaf goals', () => {
    createTestGoals();
    const leaves = QueryEngine.leaves(goals);
    expect(leaves.length).toBeGreaterThan(0);
  });

  it('should count by status', () => {
    createTestGoals();
    const counts = QueryEngine.countByStatus(goals);
    expect(counts.active).toBe(1);
    expect(counts.completed).toBe(1);
    expect(counts.planned).toBe(1);
  });

  it('should count by priority', () => {
    createTestGoals();
    const counts = QueryEngine.countByPriority(goals);
    expect(counts.high).toBe(1);
    expect(counts.critical).toBe(1);
  });

  it('should get distinct domains', () => {
    createTestGoals();
    const domains = QueryEngine.distinctDomains(goals);
    expect(domains).toContain('work');
    expect(domains).toContain('personal');
  });

  it('should get distinct tags', () => {
    createTestGoals();
    const tags = QueryEngine.distinctTags(goals);
    expect(tags).toContain('urgent');
    expect(tags).toContain('health');
  });

  it('should sort by creation date', () => {
    const goal1 = GoalClass.create({
      title: 'First',
      status: 'active',
      priority: { level: 'medium' }
    });

    const goal2 = GoalClass.create({
      title: 'Second',
      status: 'active',
      priority: { level: 'medium' }
    });

    // Ensure distinct timestamps for deterministic sorting
    goal1.createdAt = '2020-01-01T00:00:00.000Z';
    goal2.createdAt = '2021-01-01T00:00:00.000Z';

    const sorted = QueryEngine.sortByCreated([goal2, goal1], true);
    expect(sorted[0].id).toBe(goal1.id);
  });

  it('should handle complex filters', () => {
    createTestGoals();
    const results = QueryEngine.query(goals, {
      domain: 'work',
      priority: ['high', 'critical'],
      status: ['active', 'blocked']
    });

    expect(results.goals.length).toBeGreaterThan(0);
    results.goals.forEach(g => {
      expect(g.domain).toBe('work');
      expect(['high', 'critical']).toContain(g.priority.level);
      expect(['active', 'blocked']).toContain(g.status);
    });
  });
});
