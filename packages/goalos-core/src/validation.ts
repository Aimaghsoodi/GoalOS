/**
 * Schema validation using Ajv
 */

import Ajv from 'ajv';
import type { Goal, IntentGraph, ValidationResult, ValidationError, ValidationWarning } from './types.js';
import { validateGoalStructure } from './utils.js';
import { DependencyResolver } from './dependency.js';
import { PermissionManager } from './permissions.js';

/**
 * Validator for goals and intent graphs
 */
export class Validator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
  }

  /**
   * Validate a goal object
   */
  validateGoal(goal: Goal): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic structural validation
    const structureErrors = validateGoalStructure(goal);
    errors.push(
      ...structureErrors.map(msg => ({
        message: msg,
        path: 'goal'
      }))
    );

    // Title validation
    if (!goal.title || goal.title.trim().length === 0) {
      errors.push({
        message: 'Title is required and cannot be empty',
        path: 'title'
      });
    } else if (goal.title.length > 500) {
      warnings.push({
        message: 'Title is very long (>500 chars)',
        path: 'title'
      });
    }

    // Status validation
    const validStatuses = ['active', 'planned', 'blocked', 'paused', 'completed', 'abandoned'];
    if (!validStatuses.includes(goal.status)) {
      errors.push({
        message: `Invalid status: ${goal.status}`,
        path: 'status'
      });
    }

    // Priority validation
    const validPriorities = ['critical', 'high', 'medium', 'low', 'someday'];
    if (!validPriorities.includes(goal.priority.level)) {
      errors.push({
        message: `Invalid priority level: ${goal.priority.level}`,
        path: 'priority.level'
      });
    }

    if (goal.priority.score !== undefined) {
      if (goal.priority.score < 0 || goal.priority.score > 100) {
        errors.push({
          message: 'Priority score must be between 0 and 100',
          path: 'priority.score'
        });
      }
    }

    // Deadline validation
    if (goal.deadline) {
      try {
        const deadline = new Date(goal.deadline);
        if (isNaN(deadline.getTime())) {
          errors.push({
            message: 'Invalid deadline format',
            path: 'deadline'
          });
        } else if (deadline < new Date() && goal.status !== 'completed' && goal.status !== 'abandoned') {
          warnings.push({
            message: 'Goal deadline is in the past',
            path: 'deadline'
          });
        }
      } catch {
        errors.push({
          message: 'Invalid deadline format',
          path: 'deadline'
        });
      }
    }

    // Timestamps validation
    for (const ts of ['createdAt', 'updatedAt', 'completedAt'] as const) {
      if (goal[ts]) {
        try {
          const date = new Date(goal[ts]!);
          if (isNaN(date.getTime())) {
            errors.push({
              message: `Invalid ${ts} timestamp`,
              path: ts
            });
          }
        } catch {
          errors.push({
            message: `Invalid ${ts} timestamp`,
            path: ts
          });
        }
      }
    }

    // Effort validation
    if (goal.estimatedEffort) {
      const validUnits = ['minutes', 'hours', 'days', 'weeks'];
      if (!validUnits.includes(goal.estimatedEffort.unit)) {
        errors.push({
          message: `Invalid effort unit: ${goal.estimatedEffort.unit}`,
          path: 'estimatedEffort.unit'
        });
      }
      if (goal.estimatedEffort.value <= 0) {
        errors.push({
          message: 'Effort value must be positive',
          path: 'estimatedEffort.value'
        });
      }
    }

    // Success criteria validation
    if (goal.successCriteria && goal.successCriteria.length > 0) {
      for (let i = 0; i < goal.successCriteria.length; i++) {
        if (!goal.successCriteria[i] || goal.successCriteria[i].trim() === '') {
          errors.push({
            message: 'Success criteria cannot be empty',
            path: `successCriteria[${i}]`
          });
        }
      }
    } else if (goal.status === 'completed') {
      warnings.push({
        message: 'Completed goal should have success criteria',
        path: 'successCriteria'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a complete intent graph
   */
  validateGraph(graph: IntentGraph): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic structure validation
    if (!graph.id || graph.id.trim() === '') {
      errors.push({
        message: 'Graph ID is required',
        path: 'id'
      });
    }

    if (!graph.version || graph.version.trim() === '') {
      errors.push({
        message: 'Graph version is required',
        path: 'version'
      });
    }

    if (!graph.owner || graph.owner.trim() === '') {
      errors.push({
        message: 'Graph owner is required',
        path: 'owner'
      });
    }

    if (!Array.isArray(graph.goals)) {
      errors.push({
        message: 'Goals must be an array',
        path: 'goals'
      });
      return { valid: false, errors, warnings };
    }

    // Validate each goal
    const goalMap = new Map<string, Goal>();
    for (let i = 0; i < graph.goals.length; i++) {
      const goal = graph.goals[i];
      const goalValidation = this.validateGoal(goal);

      if (!goalValidation.valid) {
        errors.push(
          ...goalValidation.errors.map(e => ({
            ...e,
            path: `goals[${i}].${e.path}`
          }))
        );
      }

      warnings.push(
        ...goalValidation.warnings.map(w => ({
          ...w,
          path: `goals[${i}].${w.path}`
        }))
      );

      goalMap.set(goal.id, goal);
    }

    // Validate referential integrity
    for (let i = 0; i < graph.goals.length; i++) {
      const goal = graph.goals[i];

      // Check parent references
      if (goal.parentId && !goalMap.has(goal.parentId)) {
        errors.push({
          message: `Referenced parent goal ${goal.parentId} does not exist`,
          path: `goals[${i}].parentId`
        });
      }

      // Check dependencies
      for (let j = 0; j < (goal.dependencies?.length || 0); j++) {
        const dep = goal.dependencies![j];
        if (!goalMap.has(dep.targetGoalId)) {
          errors.push({
            message: `Referenced dependency goal ${dep.targetGoalId} does not exist`,
            path: `goals[${i}].dependencies[${j}].targetGoalId`
          });
        }
      }
    }

    // Validate cycles
    const cycles = DependencyResolver.detectCycles(graph.goals);
    if (cycles.length > 0) {
      errors.push({
        message: `Circular dependencies detected: ${cycles.map(c => c.join(' -> ')).join('; ')}`,
        path: 'goals'
      });
    }

    // Validate permissions
    for (let i = 0; i < (graph.defaultPermissions?.length || 0); i++) {
      const permission = graph.defaultPermissions![i];
      const permValidation = PermissionManager.validatePermission(permission);

      if (!permValidation.valid) {
        errors.push(
          ...permValidation.errors.map(msg => ({
            message: msg,
            path: `defaultPermissions[${i}]`
          }))
        );
      }
    }

    // Warnings for graph structure
    if (graph.goals.length === 0) {
      warnings.push({
        message: 'Graph contains no goals',
        path: 'goals'
      });
    }

    const orphaned = graph.goals.filter(g => !g.parentId && g.status !== 'completed').length;
    if (orphaned === 0 && graph.goals.length > 0) {
      warnings.push({
        message: 'All goals are either orphaned or completed',
        path: 'goals'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a single field
   */
  validateField(goal: Goal, fieldName: keyof Goal): ValidationError[] {
    const errors: ValidationError[] = [];
    const value = goal[fieldName];

    switch (fieldName) {
      case 'title':
        if (!value || String(value).trim() === '') {
          errors.push({ message: 'Title cannot be empty', path: 'title' });
        }
        break;

      case 'status':
        if (!['active', 'planned', 'blocked', 'paused', 'completed', 'abandoned'].includes(String(value))) {
          errors.push({ message: 'Invalid status value', path: 'status' });
        }
        break;

      case 'priority':
        if (
          !value ||
          typeof value !== 'object' ||
          !['critical', 'high', 'medium', 'low', 'someday'].includes((value as Record<string, unknown>).level as string)
        ) {
          errors.push({ message: 'Invalid priority', path: 'priority' });
        }
        break;

      case 'deadline':
        if (value && isNaN(new Date(String(value)).getTime())) {
          errors.push({ message: 'Invalid deadline format', path: 'deadline' });
        }
        break;
    }

    return errors;
  }

  /**
   * Get validation summary for debugging
   */
  getSummary(result: ValidationResult): string {
    const lines = [];
    lines.push(`Valid: ${result.valid}`);
    lines.push(`Errors: ${result.errors.length}`);
    lines.push(`Warnings: ${result.warnings.length}`);

    if (result.errors.length > 0) {
      lines.push('Errors:');
      for (const error of result.errors) {
        lines.push(`  - [${error.path}] ${error.message}`);
      }
    }

    if (result.warnings.length > 0) {
      lines.push('Warnings:');
      for (const warning of result.warnings) {
        lines.push(`  - [${warning.path}] ${warning.message}`);
      }
    }

    return lines.join('\n');
  }
}
