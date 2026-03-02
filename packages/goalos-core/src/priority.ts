/**
 * Priority calculation and management
 */

import type { Goal, Priority, PriorityLevel } from './types.js';
import { sortByPriority, isOverdue, daysUntilDeadline, getGoalAge } from './utils.js';

/**
 * Priority engine for calculating and managing goal priorities
 */
export class PriorityEngine {
  /**
   * Priority level base scores
   */
  private static readonly PRIORITY_SCORES: Record<PriorityLevel, number> = {
    critical: 95,
    high: 70,
    medium: 50,
    low: 25,
    someday: 5
  };

  /**
   * Calculate a numeric priority score (0-100)
   */
  static calculateScore(goal: Goal): number {
    let score = this.PRIORITY_SCORES[goal.priority.level];

    // Adjust for deadline proximity
    if (goal.deadline) {
      const daysLeft = daysUntilDeadline(goal);
      if (daysLeft !== null) {
        if (daysLeft < 0) {
          score += 20; // Overdue boost
        } else if (daysLeft <= 1) {
          score += 15;
        } else if (daysLeft <= 7) {
          score += 10;
        } else if (daysLeft <= 30) {
          score += 5;
        }
      }
    }

    // Adjust for status
    if (goal.status === 'blocked') {
      score -= 20;
    } else if (goal.status === 'paused') {
      score -= 15;
    } else if (goal.status === 'active') {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Set priority with automatic score calculation
   */
  static setPriority(goal: Goal, level: PriorityLevel, reason?: string): Priority {
    return {
      level,
      score: this.calculateScore({ ...goal, priority: { level, reason } }),
      reason
    };
  }

  /**
   * Adjust priority based on deadline
   */
  static adjustForDeadline(goal: Goal): Priority {
    const baseScore = this.PRIORITY_SCORES[goal.priority.level];
    let adjustedLevel = goal.priority.level;
    let bonus = 0;

    if (goal.deadline) {
      const daysLeft = daysUntilDeadline(goal);
      if (daysLeft === null) {
        return goal.priority;
      }

      if (daysLeft < 0) {
        adjustedLevel = 'critical';
        bonus = 20;
      } else if (daysLeft <= 1) {
        adjustedLevel = 'critical';
        bonus = 15;
      } else if (daysLeft <= 3) {
        if (goal.priority.level !== 'critical' && goal.priority.level !== 'high') {
          adjustedLevel = 'high';
        }
        bonus = 10;
      } else if (daysLeft <= 7) {
        if (goal.priority.level === 'low' || goal.priority.level === 'someday') {
          adjustedLevel = 'medium';
        }
        bonus = 5;
      }
    }

    return {
      level: adjustedLevel,
      score: Math.min(100, baseScore + bonus),
      reason: goal.priority.reason || 'Adjusted for deadline'
    };
  }

  /**
   * Get top N priority goals
   */
  static getTopPriorities(goals: Goal[], count: number = 5): Goal[] {
    return sortByPriority(goals).slice(0, count);
  }

  /**
   * Rerank all goals by priority
   */
  static rankAll(goals: Goal[]): Goal[] {
    return sortByPriority(goals);
  }

  /**
   * Get goals that should be done today
   */
  static getTodaysPriorities(goals: Goal[]): Goal[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysGoals = goals.filter(goal => {
      if (goal.status !== 'active' && goal.status !== 'planned') {
        return false;
      }

      // Check if overdue
      if (isOverdue(goal)) {
        return true;
      }

      // Check if deadline is today
      if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        deadline.setHours(0, 0, 0, 0);
        if (deadline.getTime() === today.getTime()) {
          return true;
        }
      }

      // Check if critical priority
      if (goal.priority.level === 'critical') {
        return true;
      }

      return false;
    });

    return sortByPriority(todaysGoals);
  }

  /**
   * Get goals that should be done this week
   */
  static getWeeksPriorities(goals: Goal[]): Goal[] {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const weeksGoals = goals.filter(goal => {
      if (goal.status !== 'active' && goal.status !== 'planned') {
        return false;
      }

      // Include overdue
      if (isOverdue(goal)) {
        return true;
      }

      // Check if deadline is within week
      if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        if (deadline <= weekFromNow) {
          return true;
        }
      }

      // Include high or critical
      if (goal.priority.level === 'high' || goal.priority.level === 'critical') {
        return true;
      }

      return false;
    });

    return sortByPriority(weeksGoals);
  }

  /**
   * Get urgent goals (overdue or due very soon)
   */
  static getUrgent(goals: Goal[]): Goal[] {
    const urgent = goals.filter(goal => {
      if (goal.status === 'completed' || goal.status === 'abandoned') {
        return false;
      }

      // Overdue
      if (isOverdue(goal)) {
        return true;
      }

      // Due within 24 hours
      const daysLeft = daysUntilDeadline(goal);
      if (daysLeft !== null && daysLeft <= 1) {
        return true;
      }

      return false;
    });

    return sortByPriority(urgent);
  }

  /**
   * Compare two goals by priority
   */
  static compare(goalA: Goal, goalB: Goal): number {
    const scoreA = goalA.priority.score ?? this.calculateScore(goalA);
    const scoreB = goalB.priority.score ?? this.calculateScore(goalB);
    return scoreB - scoreA; // Higher scores first
  }

  /**
   * Get priority distribution stats
   */
  static getDistribution(goals: Goal[]): Record<PriorityLevel, number> {
    const distribution: Record<PriorityLevel, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      someday: 0
    };

    for (const goal of goals) {
      distribution[goal.priority.level]++;
    }

    return distribution;
  }

  /**
   * Check if priority is appropriate for status
   */
  static validatePriority(goal: Goal): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (goal.status === 'completed' && goal.priority.level !== 'someday') {
      warnings.push('Completed goals should have low priority');
    }

    if (goal.status === 'planned' && goal.priority.level === 'critical') {
      warnings.push('Planned goals should not be critical priority');
    }

    if (goal.status === 'abandoned' && goal.priority.level !== 'someday') {
      warnings.push('Abandoned goals should have low priority');
    }

    if (isOverdue(goal) && goal.priority.level !== 'critical') {
      warnings.push('Overdue goals should be critical priority');
    }

    return {
      valid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Suggest priority adjustments based on goal state
   */
  static suggestAdjustment(goal: Goal): { suggested: Priority; reason: string } | null {
    if (isOverdue(goal)) {
      return {
        suggested: {
          level: 'critical',
          score: 100,
          reason: 'Goal is overdue'
        },
        reason: 'This goal is overdue and should be critical priority'
      };
    }

    const daysLeft = daysUntilDeadline(goal);
    if (daysLeft !== null && daysLeft <= 3 && daysLeft >= 0) {
      return {
        suggested: {
          level: 'high',
          score: 85,
          reason: 'Deadline is within 3 days'
        },
        reason: 'This goal is due very soon'
      };
    }

    return null;
  }
}
