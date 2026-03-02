/**
 * Goal querying and filtering
 */

import type { Goal, GoalFilter, QueryResult } from './types.js';

/**
 * Query engine for filtering and searching goals
 */
export class QueryEngine {
  /**
   * Execute a query on goals
   */
  static query(goals: Goal[], filter: GoalFilter): QueryResult {
    const startTime = performance.now();
    const filtered = goals.filter(goal => this.matches(goal, filter));
    const endTime = performance.now();

    return {
      goals: filtered,
      total: filtered.length,
      executionTime: endTime - startTime
    };
  }

  /**
   * Check if a goal matches a filter
   */
  static matches(goal: Goal, filter: GoalFilter): boolean {
    // Status filter
    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      if (!statuses.includes(goal.status)) {
        return false;
      }
    }

    // Priority filter
    if (filter.priority) {
      const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
      if (!priorities.includes(goal.priority.level)) {
        return false;
      }
    }

    // Domain filter
    if (filter.domain) {
      const domains = Array.isArray(filter.domain) ? filter.domain : [filter.domain];
      if (!goal.domain || !domains.includes(goal.domain)) {
        return false;
      }
    }

    // Tags filter (must have all tags)
    if (filter.tags && filter.tags.length > 0) {
      const goalTags = goal.tags || [];
      if (!filter.tags.every(tag => goalTags.includes(tag))) {
        return false;
      }
    }

    // Time horizon filter
    if (filter.timeHorizon && goal.timeHorizon !== filter.timeHorizon) {
      return false;
    }

    // Parent ID filter
    if (filter.parentId !== undefined && goal.parentId !== filter.parentId) {
      return false;
    }

    // Has deadline filter
    if (filter.hasDeadline !== undefined) {
      const hasDeadline = !!goal.deadline;
      if (hasDeadline !== filter.hasDeadline) {
        return false;
      }
    }

    // Deadline date filters
    if (filter.deadlineBefore && goal.deadline) {
      if (new Date(goal.deadline) > new Date(filter.deadlineBefore)) {
        return false;
      }
    }

    if (filter.deadlineAfter && goal.deadline) {
      if (new Date(goal.deadline) < new Date(filter.deadlineAfter)) {
        return false;
      }
    }

    // Created date filters
    if (filter.createdAfter) {
      if (new Date(goal.createdAt) < new Date(filter.createdAfter)) {
        return false;
      }
    }

    if (filter.createdBefore) {
      if (new Date(goal.createdAt) > new Date(filter.createdBefore)) {
        return false;
      }
    }

    // Full-text search
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const titleMatch = goal.title.toLowerCase().includes(searchLower);
      const descMatch = goal.description?.toLowerCase().includes(searchLower) ?? false;
      if (!titleMatch && !descMatch) {
        return false;
      }
    }

    return true;
  }

  /**
   * Filter goals by status
   */
  static byStatus(goals: Goal[], status: string | string[]): Goal[] {
    const statuses = Array.isArray(status) ? status : [status];
    return goals.filter(g => statuses.includes(g.status));
  }

  /**
   * Filter goals by priority level
   */
  static byPriority(goals: Goal[], priority: string | string[]): Goal[] {
    const priorities = Array.isArray(priority) ? priority : [priority];
    return goals.filter(g => priorities.includes(g.priority.level));
  }

  /**
   * Filter goals by domain
   */
  static byDomain(goals: Goal[], domain: string | string[]): Goal[] {
    const domains = Array.isArray(domain) ? domain : [domain];
    return goals.filter(g => g.domain && domains.includes(g.domain));
  }

  /**
   * Filter goals by tag
   */
  static byTag(goals: Goal[], tag: string | string[]): Goal[] {
    const tags = Array.isArray(tag) ? tag : [tag];
    return goals.filter(g => {
      const goalTags = g.tags || [];
      return tags.some(t => goalTags.includes(t));
    });
  }

  /**
   * Filter goals by time horizon
   */
  static byTimeHorizon(goals: Goal[], horizon: string): Goal[] {
    return goals.filter(g => g.timeHorizon === horizon);
  }

  /**
   * Filter goals by deadline
   */
  static withDeadline(goals: Goal[]): Goal[] {
    return goals.filter(g => !!g.deadline);
  }

  /**
   * Filter goals that are overdue
   */
  static overdue(goals: Goal[]): Goal[] {
    const now = new Date();
    return goals.filter(g => {
      if (!g.deadline || g.status === 'completed' || g.status === 'abandoned') {
        return false;
      }
      return new Date(g.deadline) < now;
    });
  }

  /**
   * Filter goals due today
   */
  static dueToday(goals: Goal[]): Goal[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return goals.filter(g => {
      if (!g.deadline) return false;
      const deadline = new Date(g.deadline);
      deadline.setHours(0, 0, 0, 0);
      return deadline.getTime() === today.getTime();
    });
  }

  /**
   * Filter goals due this week
   */
  static dueThisWeek(goals: Goal[]): Goal[] {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return goals.filter(g => {
      if (!g.deadline) return false;
      const deadline = new Date(g.deadline);
      return deadline >= today && deadline <= weekFromNow;
    });
  }

  /**
   * Filter goals due this month
   */
  static dueThisMonth(goals: Goal[]): Goal[] {
    const today = new Date();
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    return goals.filter(g => {
      if (!g.deadline) return false;
      const deadline = new Date(g.deadline);
      return deadline >= today && deadline <= monthFromNow;
    });
  }

  /**
   * Filter active goals
   */
  static active(goals: Goal[]): Goal[] {
    return goals.filter(g => g.status === 'active');
  }

  /**
   * Filter completed goals
   */
  static completed(goals: Goal[]): Goal[] {
    return goals.filter(g => g.status === 'completed');
  }

  /**
   * Filter blocked goals
   */
  static blocked(goals: Goal[]): Goal[] {
    return goals.filter(g => g.status === 'blocked');
  }

  /**
   * Filter planned goals
   */
  static planned(goals: Goal[]): Goal[] {
    return goals.filter(g => g.status === 'planned');
  }

  /**
   * Search by text
   */
  static search(goals: Goal[], query: string): Goal[] {
    const lowerQuery = query.toLowerCase();
    return goals.filter(g => {
      const titleMatch = g.title.toLowerCase().includes(lowerQuery);
      const descMatch = g.description?.toLowerCase().includes(lowerQuery) ?? false;
      const tagsMatch = g.tags?.some(t => t.toLowerCase().includes(lowerQuery)) ?? false;
      return titleMatch || descMatch || tagsMatch;
    });
  }

  /**
   * Get child goals
   */
  static children(goals: Goal[], parentId: string): Goal[] {
    return goals.filter(g => g.parentId === parentId);
  }

  /**
   * Get parent goal
   */
  static parent(goals: Goal[], childId: string): Goal | undefined {
    const child = goals.find(g => g.id === childId);
    if (!child || !child.parentId) return undefined;
    return goals.find(g => g.id === child.parentId);
  }

  /**
   * Get all descendants
   */
  static descendants(goals: Goal[], parentId: string): Goal[] {
    const result: Goal[] = [];
    const queue = [parentId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = this.children(goals, current);

      for (const child of children) {
        result.push(child);
        queue.push(child.id);
      }
    }

    return result;
  }

  /**
   * Get all ancestors
   */
  static ancestors(goals: Goal[], childId: string): Goal[] {
    const result: Goal[] = [];
    const goalMap = new Map(goals.map(g => [g.id, g]));

    let current = goalMap.get(childId);
    while (current && current.parentId) {
      const parent = goalMap.get(current.parentId);
      if (parent) {
        result.push(parent);
        current = parent;
      } else {
        break;
      }
    }

    return result;
  }

  /**
   * Get root goals (no parent)
   */
  static roots(goals: Goal[]): Goal[] {
    return goals.filter(g => !g.parentId);
  }

  /**
   * Get leaf goals (no children)
   */
  static leaves(goals: Goal[]): Goal[] {
    const hasChildren = new Set(goals.map(g => g.parentId).filter(Boolean));
    return goals.filter(g => !hasChildren.has(g.id));
  }

  /**
   * Get goals created in the last N days
   */
  static recentlyCreated(goals: Goal[], days: number): Goal[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return goals.filter(g => new Date(g.createdAt) > cutoff);
  }

  /**
   * Get distinct domains in goals
   */
  static distinctDomains(goals: Goal[]): string[] {
    const domains = new Set<string>();
    for (const goal of goals) {
      if (goal.domain) {
        domains.add(goal.domain);
      }
    }
    return Array.from(domains).sort();
  }

  /**
   * Get distinct tags in goals
   */
  static distinctTags(goals: Goal[]): string[] {
    const tags = new Set<string>();
    for (const goal of goals) {
      if (goal.tags) {
        for (const tag of goal.tags) {
          tags.add(tag);
        }
      }
    }
    return Array.from(tags).sort();
  }

  /**
   * Count goals by status
   */
  static countByStatus(goals: Goal[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const goal of goals) {
      counts[goal.status] = (counts[goal.status] || 0) + 1;
    }
    return counts;
  }

  /**
   * Count goals by priority
   */
  static countByPriority(goals: Goal[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const goal of goals) {
      counts[goal.priority.level] = (counts[goal.priority.level] || 0) + 1;
    }
    return counts;
  }

  /**
   * Sort goals by creation date
   */
  static sortByCreated(goals: Goal[], ascending: boolean = true): Goal[] {
    return [...goals].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return ascending ? aTime - bTime : bTime - aTime;
    });
  }

  /**
   * Sort goals by deadline
   */
  static sortByDeadline(goals: Goal[], ascending: boolean = true): Goal[] {
    const withDeadline = goals.filter(g => g.deadline);
    const withoutDeadline = goals.filter(g => !g.deadline);

    const sorted = withDeadline.sort((a, b) => {
      const aTime = new Date(a.deadline!).getTime();
      const bTime = new Date(b.deadline!).getTime();
      return ascending ? aTime - bTime : bTime - aTime;
    });

    return [...sorted, ...withoutDeadline];
  }
}
