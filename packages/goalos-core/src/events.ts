/**
 * Event system for tracking goal state changes
 */

import type { Goal, GoalEvent, GoalEventType } from './types.js';
import { generateEventId, getCurrentTimestamp } from './utils.js';

/**
 * Type for event handler functions
 */
export type EventHandler = (event: GoalEvent) => void;

/**
 * Event emitter for goal changes
 */
export class EventEmitter {
  private listeners: Map<GoalEventType, EventHandler[]> = new Map();

  /**
   * Register a listener for an event type
   */
  on(eventType: GoalEventType, handler: EventHandler): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(handler);
  }

  /**
   * Unregister a listener
   */
  off(eventType: GoalEventType, handler: EventHandler): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all listeners
   */
  emit(event: GoalEvent): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      }
    }
  }

  /**
   * Remove all listeners for an event type
   */
  removeAllListeners(eventType?: GoalEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get count of listeners for an event type
   */
  listenerCount(eventType: GoalEventType): number {
    return this.listeners.get(eventType)?.length ?? 0;
  }
}

/**
 * Event logger for tracking goal history
 */
export class EventLogger {
  private events: GoalEvent[] = [];

  /**
   * Log a new event
   */
  log(event: GoalEvent): void {
    this.events.push(event);
  }

  /**
   * Create and log a goal created event
   */
  logCreated(goal: Goal, agentId?: string): GoalEvent {
    const event: GoalEvent = {
      id: generateEventId(),
      type: 'goal.created',
      goalId: goal.id,
      timestamp: getCurrentTimestamp(),
      agentId
    };
    this.log(event);
    return event;
  }

  /**
   * Create and log a goal updated event
   */
  logUpdated(goal: Goal, previousState: Partial<Goal>, agentId?: string): GoalEvent {
    const event: GoalEvent = {
      id: generateEventId(),
      type: 'goal.updated',
      goalId: goal.id,
      timestamp: getCurrentTimestamp(),
      agentId,
      previousState
    };
    this.log(event);
    return event;
  }

  /**
   * Create and log a goal completed event
   */
  logCompleted(goal: Goal, agentId?: string): GoalEvent {
    const event: GoalEvent = {
      id: generateEventId(),
      type: 'goal.completed',
      goalId: goal.id,
      timestamp: getCurrentTimestamp(),
      agentId,
      data: {
        completedAt: goal.completedAt
      }
    };
    this.log(event);
    return event;
  }

  /**
   * Create and log a goal abandoned event
   */
  logAbandoned(goal: Goal, reason?: string, agentId?: string): GoalEvent {
    const event: GoalEvent = {
      id: generateEventId(),
      type: 'goal.abandoned',
      goalId: goal.id,
      timestamp: getCurrentTimestamp(),
      agentId,
      data: {
        reason,
        abandonedAt: goal.completedAt
      }
    };
    this.log(event);
    return event;
  }

  /**
   * Create and log a goal blocked event
   */
  logBlocked(goal: Goal, blockedBy?: string, agentId?: string): GoalEvent {
    const event: GoalEvent = {
      id: generateEventId(),
      type: 'goal.blocked',
      goalId: goal.id,
      timestamp: getCurrentTimestamp(),
      agentId,
      data: { blockedBy }
    };
    this.log(event);
    return event;
  }

  /**
   * Create and log a goal unblocked event
   */
  logUnblocked(goal: Goal, agentId?: string): GoalEvent {
    const event: GoalEvent = {
      id: generateEventId(),
      type: 'goal.unblocked',
      goalId: goal.id,
      timestamp: getCurrentTimestamp(),
      agentId
    };
    this.log(event);
    return event;
  }

  /**
   * Create and log a goal prioritized event
   */
  logPrioritized(goal: Goal, agentId?: string): GoalEvent {
    const event: GoalEvent = {
      id: generateEventId(),
      type: 'goal.prioritized',
      goalId: goal.id,
      timestamp: getCurrentTimestamp(),
      agentId,
      data: {
        newPriority: goal.priority
      }
    };
    this.log(event);
    return event;
  }

  /**
   * Create and log a dependency added event
   */
  logDependencyAdded(goal: Goal, dependencyTargetId: string, agentId?: string): GoalEvent {
    const event: GoalEvent = {
      id: generateEventId(),
      type: 'goal.dependency_added',
      goalId: goal.id,
      timestamp: getCurrentTimestamp(),
      agentId,
      data: { dependencyTargetId }
    };
    this.log(event);
    return event;
  }

  /**
   * Create and log a dependency removed event
   */
  logDependencyRemoved(goal: Goal, dependencyTargetId: string, agentId?: string): GoalEvent {
    const event: GoalEvent = {
      id: generateEventId(),
      type: 'goal.dependency_removed',
      goalId: goal.id,
      timestamp: getCurrentTimestamp(),
      agentId,
      data: { dependencyTargetId }
    };
    this.log(event);
    return event;
  }

  /**
   * Create and log a permission granted event
   */
  logPermissionGranted(goal: Goal, agentId?: string, grantedTo?: string): GoalEvent {
    const event: GoalEvent = {
      id: generateEventId(),
      type: 'goal.permission_granted',
      goalId: goal.id,
      timestamp: getCurrentTimestamp(),
      agentId,
      data: { grantedTo }
    };
    this.log(event);
    return event;
  }

  /**
   * Create and log a permission revoked event
   */
  logPermissionRevoked(goal: Goal, agentId?: string, revokedFrom?: string): GoalEvent {
    const event: GoalEvent = {
      id: generateEventId(),
      type: 'goal.permission_revoked',
      goalId: goal.id,
      timestamp: getCurrentTimestamp(),
      agentId,
      data: { revokedFrom }
    };
    this.log(event);
    return event;
  }

  /**
   * Get all events
   */
  getAll(): GoalEvent[] {
    return [...this.events];
  }

  /**
   * Get events for a specific goal
   */
  getForGoal(goalId: string): GoalEvent[] {
    return this.events.filter(e => e.goalId === goalId);
  }

  /**
   * Get events of a specific type
   */
  getByType(type: GoalEventType): GoalEvent[] {
    return this.events.filter(e => e.type === type);
  }

  /**
   * Get events after a specific timestamp
   */
  getAfter(timestamp: string): GoalEvent[] {
    return this.events.filter(e => e.timestamp > timestamp);
  }

  /**
   * Get events before a specific timestamp
   */
  getBefore(timestamp: string): GoalEvent[] {
    return this.events.filter(e => e.timestamp < timestamp);
  }

  /**
   * Get events by agent
   */
  getByAgent(agentId: string): GoalEvent[] {
    return this.events.filter(e => e.agentId === agentId);
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Get event count
   */
  count(): number {
    return this.events.length;
  }

  /**
   * Export events as JSON
   */
  toJSON(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Import events from JSON
   */
  fromJSON(json: string): void {
    this.events = JSON.parse(json);
  }
}
