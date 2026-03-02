import { describe, it, expect } from 'vitest';
import { PriorityEngine } from '../src/priority.js';
import { GoalClass } from '../src/goal.js';
import type { Goal } from '../src/types.js';

describe('PriorityEngine', () => {
  it('should calculate priority scores', () => {
    const goal = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'high' }
    });

    const score = PriorityEngine.calculateScore(goal);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should rank critical higher than low', () => {
    const critical = GoalClass.create({
      title: 'Critical',
      status: 'active',
      priority: { level: 'critical' }
    });

    const low = GoalClass.create({
      title: 'Low',
      status: 'active',
      priority: { level: 'low' }
    });

    const criticalScore = PriorityEngine.calculateScore(critical);
    const lowScore = PriorityEngine.calculateScore(low);

    expect(criticalScore).toBeGreaterThan(lowScore);
  });

  it('should set priority with automatic score', () => {
    const goal = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const priority = PriorityEngine.setPriority(goal, 'high', 'Important');
    expect(priority.level).toBe('high');
    expect(priority.reason).toBe('Important');
    expect(priority.score).toBeDefined();
  });

  it('should adjust priority for deadline', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const goal = GoalClass.create({
      title: 'Urgent',
      status: 'active',
      priority: { level: 'medium' },
      deadline: tomorrow.toISOString()
    });

    const adjusted = PriorityEngine.adjustForDeadline(goal);
    expect(adjusted.score).toBeGreaterThan(goal.priority.score ?? 50);
  });

  it('should get top priorities', () => {
    const goals: Goal[] = [];
    for (let i = 0; i < 5; i++) {
      goals.push(
        GoalClass.create({
          title: `Goal ${i}`,
          status: 'active',
          priority: { level: i === 0 ? 'critical' : 'low' }
        })
      );
    }

    const top = PriorityEngine.getTopPriorities(goals, 2);
    expect(top).toHaveLength(2);
  });

  it('should get todays priorities', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate());

    const goal = GoalClass.create({
      title: 'Today',
      status: 'active',
      priority: { level: 'medium' },
      deadline: today.toISOString()
    });

    const todaysPriorities = PriorityEngine.getTodaysPriorities([goal]);
    expect(todaysPriorities.length).toBeGreaterThan(0);
  });

  it('should get weeks priorities', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    const goal = GoalClass.create({
      title: 'This week',
      status: 'active',
      priority: { level: 'high' },
      deadline: futureDate.toISOString()
    });

    const weeksPriorities = PriorityEngine.getWeeksPriorities([goal]);
    expect(weeksPriorities.length).toBeGreaterThan(0);
  });

  it('should identify urgent goals', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const overdueGoal = GoalClass.create({
      title: 'Overdue',
      status: 'active',
      priority: { level: 'medium' },
      deadline: yesterday.toISOString()
    });

    const urgent = PriorityEngine.getUrgent([overdueGoal]);
    expect(urgent.map(g => g.id)).toContain(overdueGoal.id);
  });

  it('should compare goals by priority', () => {
    const high = GoalClass.create({
      title: 'High',
      status: 'active',
      priority: { level: 'high' }
    });

    const low = GoalClass.create({
      title: 'Low',
      status: 'active',
      priority: { level: 'low' }
    });

    const comparison = PriorityEngine.compare(high, low);
    expect(comparison).toBeGreaterThan(0); // High should sort before low
  });

  it('should get priority distribution', () => {
    const goals: Goal[] = [
      GoalClass.create({
        title: 'Critical',
        status: 'active',
        priority: { level: 'critical' }
      }),
      GoalClass.create({
        title: 'High',
        status: 'active',
        priority: { level: 'high' }
      }),
      GoalClass.create({
        title: 'Low',
        status: 'active',
        priority: { level: 'low' }
      })
    ];

    const distribution = PriorityEngine.getDistribution(goals);
    expect(distribution.critical).toBe(1);
    expect(distribution.high).toBe(1);
    expect(distribution.low).toBe(1);
  });

  it('should validate priority', () => {
    const goal = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const result = PriorityEngine.validatePriority(goal);
    expect(result.valid).toBe(true);
  });

  it('should suggest priority adjustments for overdue goals', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const overdueGoal = GoalClass.create({
      title: 'Overdue',
      status: 'active',
      priority: { level: 'low' },
      deadline: yesterday.toISOString()
    });

    const suggestion = PriorityEngine.suggestAdjustment(overdueGoal);
    expect(suggestion).toBeDefined();
    expect(suggestion?.suggested.level).toBe('critical');
  });

  it('should rank all goals by priority', () => {
    const goals: Goal[] = [
      GoalClass.create({
        title: 'Low',
        status: 'active',
        priority: { level: 'low' }
      }),
      GoalClass.create({
        title: 'Critical',
        status: 'active',
        priority: { level: 'critical' }
      }),
      GoalClass.create({
        title: 'Medium',
        status: 'active',
        priority: { level: 'medium' }
      })
    ];

    const ranked = PriorityEngine.rankAll(goals);
    expect(ranked[0].priority.level).toBe('critical');
    expect(ranked[2].priority.level).toBe('low');
  });

  it('should handle all priority levels consistently', () => {
    const levels = ['critical', 'high', 'medium', 'low', 'someday'] as const;
    const goals = levels.map(level =>
      GoalClass.create({
        title: level,
        status: 'active',
        priority: { level }
      })
    );

    const ranked = PriorityEngine.rankAll(goals);
    for (let i = 0; i < ranked.length - 1; i++) {
      const scoreA = ranked[i].priority.score ?? PriorityEngine.calculateScore(ranked[i]);
      const scoreB = ranked[i + 1].priority.score ?? PriorityEngine.calculateScore(ranked[i + 1]);
      expect(scoreA).toBeGreaterThanOrEqual(scoreB);
    }
  });
});
