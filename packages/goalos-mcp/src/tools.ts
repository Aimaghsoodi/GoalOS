/**
 * GoalOS MCP Tool Definitions
 * Defines all 9 tools exposed by the MCP server
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const tools: Tool[] = [
  {
    name: 'goalos_get_context',
    description: "Get summary of current priorities, active goals, deadlines, blocked items.",
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  {
    name: 'goalos_list_goals',
    description: 'List all goals with optional filtering. Returns goals in hierarchical tree structure.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['active', 'planned', 'blocked', 'paused', 'completed', 'abandoned']
          },
          description: 'Filter by goal status'
        },
        priority: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['critical', 'high', 'medium', 'low', 'someday']
          },
          description: 'Filter by priority level'
        },
        domain: {
          type: 'string',
          description: 'Filter by domain (work, personal, health, creative)'
        },
        include_completed: {
          type: 'boolean',
          description: 'Include completed goals in results',
          default: false
        }
      },
      required: []
    }
  },

  {
    name: 'goalos_get_priorities',
    description: 'Get the top N priority goals for a specific time horizon.',
    inputSchema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of top priorities to return',
          default: 5
        },
        time_horizon: {
          type: 'string',
          enum: ['today', 'this_week', 'this_month', 'this_quarter', 'this_year', 'long_term'],
          description: 'Filter by time horizon'
        }
      },
      required: []
    }
  },

  {
    name: 'goalos_get_goal',
    description: 'Get full details of a specific goal including sub-goals and dependencies.',
    inputSchema: {
      type: 'object',
      properties: {
        goal_id: {
          type: 'string',
          description: 'The ID of the goal to retrieve'
        }
      },
      required: ['goal_id']
    }
  },

  {
    name: 'goalos_add_goal',
    description: 'Add a new goal to the intent graph.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Short, descriptive title for the goal'
        },
        description: {
          type: 'string',
          description: 'Longer explanation of what this goal is about'
        },
        parent_id: {
          type: 'string',
          description: 'ID of parent goal if this is a sub-goal'
        },
        priority: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low', 'someday'],
          description: 'Priority level for this goal'
        },
        domain: {
          type: 'string',
          description: 'Domain for categorization'
        },
        deadline: {
          type: 'string',
          description: 'ISO 8601 deadline date'
        },
        time_horizon: {
          type: 'string',
          enum: ['today', 'this_week', 'this_month', 'this_quarter', 'this_year', 'long_term'],
          description: 'Time horizon for completion'
        },
        success_criteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Measurable criteria for completion'
        },
        motivation: {
          type: 'string',
          description: 'Why this goal matters'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization'
        }
      },
      required: ['title']
    }
  },

  {
    name: 'goalos_update_goal',
    description: 'Update an existing goal with new information.',
    inputSchema: {
      type: 'object',
      properties: {
        goal_id: {
          type: 'string',
          description: 'The ID of the goal to update'
        },
        title: {
          type: 'string',
          description: 'New title for the goal'
        },
        description: {
          type: 'string',
          description: 'Updated description'
        },
        status: {
          type: 'string',
          enum: ['active', 'planned', 'blocked', 'paused', 'completed', 'abandoned'],
          description: 'New status for the goal'
        },
        priority: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low', 'someday'],
          description: 'New priority level'
        },
        deadline: {
          type: 'string',
          description: 'Updated deadline in ISO 8601 format'
        },
        motivation: {
          type: 'string',
          description: 'Updated motivation'
        },
        success_criteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated success criteria'
        }
      },
      required: ['goal_id']
    }
  },

  {
    name: 'goalos_complete_goal',
    description: 'Mark a goal as complete. Updates parent progress and unblocks dependents.',
    inputSchema: {
      type: 'object',
      properties: {
        goal_id: {
          type: 'string',
          description: 'The ID of the goal to mark as complete'
        },
        notes: {
          type: 'string',
          description: 'Optional notes about the completion'
        }
      },
      required: ['goal_id']
    }
  },

  {
    name: 'goalos_add_dependency',
    description: 'Add a dependency relationship between two goals.',
    inputSchema: {
      type: 'object',
      properties: {
        goal_id: {
          type: 'string',
          description: 'The goal that has the dependency'
        },
        depends_on: {
          type: 'string',
          description: 'The goal ID that this goal depends on'
        },
        type: {
          type: 'string',
          enum: ['blocks', 'requires', 'enables', 'related'],
          description: 'Type of dependency relationship',
          default: 'requires'
        },
        description: {
          type: 'string',
          description: 'Optional description of the dependency'
        }
      },
      required: ['goal_id', 'depends_on']
    }
  },

  {
    name: 'goalos_search',
    description: 'Full-text search across goal titles, descriptions, and tags.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        status: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['active', 'planned', 'blocked', 'paused', 'completed', 'abandoned']
          },
          description: 'Filter results by status'
        }
      },
      required: ['query']
    }
  }
];
