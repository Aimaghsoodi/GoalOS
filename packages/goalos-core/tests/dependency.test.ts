import { describe, it, expect } from 'vitest';
import { DependencyResolver } from '../src/dependency.js';
import { GoalClass } from '../src/goal.js';
import type { Goal } from '../src/types.js';

describe('DependencyResolver', () => {
  let goals: Goal[];

  function setup() {
    goals = [
      GoalClass.create({
        title: 'Goal A',
        status: 'active',
        priority: { level: 'medium' }
      }),
      GoalClass.create({
        title: 'Goal B',
        status: 'active',
        priority: { level: 'medium' }
      }),
      GoalClass.create({
        title: 'Goal C',
        status: 'active',
        priority: { level: 'medium' }
      })
    ];
  }

  it('should get dependencies', () => {
    setup();
    goals[1] = GoalClass.addDependency(goals[1], {
      type: 'requires',
      targetGoalId: goals[0].id
    });

    const deps = DependencyResolver.getDependencies(goals[1], goals);
    expect(deps).toHaveLength(1);
    expect(deps[0].id).toBe(goals[0].id);
  });

  it('should get dependents', () => {
    setup();
    goals[1] = GoalClass.addDependency(goals[1], {
      type: 'requires',
      targetGoalId: goals[0].id
    });

    const dependents = DependencyResolver.getDependents(goals[0], goals);
    expect(dependents).toHaveLength(1);
    expect(dependents[0].id).toBe(goals[1].id);
  });

  it('should get blockers', () => {
    setup();
    goals[1] = GoalClass.addDependency(goals[1], {
      type: 'requires',
      targetGoalId: goals[0].id
    });

    const blockers = DependencyResolver.getBlockers(goals[1], goals);
    expect(blockers).toHaveLength(1);
    expect(blockers[0].id).toBe(goals[0].id);
  });

  it('should get enablers', () => {
    setup();
    goals[1] = GoalClass.addDependency(goals[1], {
      type: 'enables',
      targetGoalId: goals[2].id
    });

    const enablers = DependencyResolver.getEnablers(goals[2], goals);
    expect(enablers).toHaveLength(1);
    expect(enablers[0].id).toBe(goals[1].id);
  });

  it('should get related goals', () => {
    setup();
    goals[0] = GoalClass.addDependency(goals[0], {
      type: 'related',
      targetGoalId: goals[1].id
    });

    const related = DependencyResolver.getRelated(goals[0], goals);
    expect(related.length).toBeGreaterThanOrEqual(1);
  });

  it('should get dependency chain', () => {
    setup();
    // A <- B <- C
    goals[1] = GoalClass.addDependency(goals[1], {
      type: 'requires',
      targetGoalId: goals[0].id
    });
    goals[2] = GoalClass.addDependency(goals[2], {
      type: 'requires',
      targetGoalId: goals[1].id
    });

    const chain = DependencyResolver.getDependencyChain(goals[2], goals);
    expect(chain.length).toBeGreaterThanOrEqual(2);
  });

  it('should detect cycles', () => {
    setup();
    goals[0] = GoalClass.addDependency(goals[0], {
      type: 'requires',
      targetGoalId: goals[1].id
    });
    goals[1] = GoalClass.addDependency(goals[1], {
      type: 'requires',
      targetGoalId: goals[0].id
    });

    const cycles = DependencyResolver.detectCycles(goals);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('should detect if adding dependency would create a cycle', () => {
    setup();
    goals[0] = GoalClass.addDependency(goals[0], {
      type: 'requires',
      targetGoalId: goals[1].id
    });

    const wouldCycle = DependencyResolver.wouldCreateCycle(
      goals[1].id,
      goals[0].id,
      goals
    );
    expect(wouldCycle).toBe(true);
  });

  it('should get blocked goals', () => {
    setup();
    goals[1] = GoalClass.addDependency(goals[1], {
      type: 'requires',
      targetGoalId: goals[0].id
    });

    const blocked = DependencyResolver.getBlockedGoals(goals);
    expect(blocked.map(g => g.id)).toContain(goals[1].id);
  });

  it('should get unblocked goals', () => {
    setup();
    goals[1] = GoalClass.addDependency(goals[1], {
      type: 'requires',
      targetGoalId: goals[0].id
    });

    const unblocked = DependencyResolver.getUnblockedGoals(goals);
    expect(unblocked.map(g => g.id)).toContain(goals[0].id);
  });

  it('should validate dependencies', () => {
    setup();
    goals[1] = GoalClass.addDependency(goals[1], {
      type: 'requires',
      targetGoalId: goals[0].id
    });

    const result = DependencyResolver.validateDependencies(goals);
    expect(result.valid).toBe(true);
  });

  it('should detect invalid dependency references', () => {
    setup();
    goals[1] = GoalClass.addDependency(goals[1], {
      type: 'requires',
      targetGoalId: 'goal_nonexistent'
    });

    const result = DependencyResolver.validateDependencies(goals);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
