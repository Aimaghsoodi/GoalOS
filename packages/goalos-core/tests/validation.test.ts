import { describe, it, expect } from 'vitest';
import { Validator } from '../src/validation.js';
import { GoalClass } from '../src/goal.js';
import { IntentGraphClass } from '../src/intent-graph.js';

describe('Validator', () => {
  const validator = new Validator();

  it('should validate a correct goal', () => {
    const goal = GoalClass.create({
      title: 'Valid Goal',
      status: 'active',
      priority: { level: 'medium' }
    });

    const result = validator.validateGoal(goal);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject goal with empty title', () => {
    const result = validator.validateGoal({
      id: 'goal_test',
      title: '',
      status: 'active',
      priority: { level: 'medium' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject goal with invalid status', () => {
    const goal = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const invalid = {
      ...goal,
      status: 'invalid_status' as any
    };

    const result = validator.validateGoal(invalid);
    expect(result.valid).toBe(false);
  });

  it('should warn on overdue goals', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);

    const goal = GoalClass.create({
      title: 'Overdue',
      status: 'active',
      priority: { level: 'medium' },
      deadline: past.toISOString()
    });

    const result = validator.validateGoal(goal);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should validate a correct graph', () => {
    const graph = IntentGraphClass.create('user123', 'Test Graph');
    graph.addGoal({
      title: 'Test Goal',
      status: 'active',
      priority: { level: 'medium' }
    });

    const result = validator.validateGraph(graph.toJSON());
    expect(result.valid).toBe(true);
  });

  it('should detect missing graph ID', () => {
    const invalid = {
      id: '',
      version: '0.1.0',
      owner: 'user123',
      goals: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = validator.validateGraph(invalid as any);
    expect(result.valid).toBe(false);
  });

  it('should detect invalid dependency references', () => {
    const graph = IntentGraphClass.create('user123');
    const goal = graph.addGoal({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    graph.updateGoal(goal.id, {
      dependencies: [
        { type: 'requires', targetGoalId: 'goal_nonexistent' }
      ]
    });

    const result = validator.validateGraph(graph.toJSON());
    expect(result.valid).toBe(false);
  });

  it('should validate all priority levels', () => {
    const levels = ['critical', 'high', 'medium', 'low', 'someday'];

    for (const level of levels) {
      const goal = GoalClass.create({
        title: 'Test',
        status: 'active',
        priority: { level: level as any }
      });

      const result = validator.validateGoal(goal);
      expect(result.valid).toBe(true);
    }
  });

  it('should detect invalid priority score', () => {
    const goal = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const invalid = {
      ...goal,
      priority: { level: 'medium', score: 150 }
    };

    const result = validator.validateGoal(invalid);
    expect(result.valid).toBe(false);
  });

  it('should validate success criteria', () => {
    const goal = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' },
      successCriteria: ['Valid criterion']
    });

    const result = validator.validateGoal(goal);
    expect(result.valid).toBe(true);
  });

  it('should warn on completed goal without success criteria', () => {
    const goal = GoalClass.complete(
      GoalClass.create({
        title: 'Completed',
        status: 'active',
        priority: { level: 'medium' }
      })
    );

    const result = validator.validateGoal(goal);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should get validation summary', () => {
    const goal = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const result = validator.validateGoal(goal);
    const summary = validator.getSummary(result);

    expect(summary).toContain('Valid: true');
  });

  it('should validate individual fields', () => {
    const goal = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const errors = validator.validateField(goal, 'title');
    expect(errors).toHaveLength(0);

    const invalidGoal = { ...goal, title: '' };
    const errors2 = validator.validateField(invalidGoal, 'title');
    expect(errors2.length).toBeGreaterThan(0);
  });

  it('should validate graph with circular dependencies', () => {
    const graph = IntentGraphClass.create('user123');
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

    graph.updateGoal(goal1.id, {
      dependencies: [{ type: 'requires', targetGoalId: goal2.id }]
    });

    graph.updateGoal(goal2.id, {
      dependencies: [{ type: 'requires', targetGoalId: goal1.id }]
    });

    const result = validator.validateGraph(graph.toJSON());
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('Circular'))).toBe(true);
  });

  it('should validate timestamps', () => {
    const goal = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const invalid = {
      ...goal,
      createdAt: 'invalid-date'
    };

    const result = validator.validateGoal(invalid);
    expect(result.valid).toBe(false);
  });

  it('should validate effort values', () => {
    const goal = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' },
      estimatedEffort: { value: -5, unit: 'hours' }
    });

    const result = validator.validateGoal(goal);
    expect(result.valid).toBe(false);
  });
});
