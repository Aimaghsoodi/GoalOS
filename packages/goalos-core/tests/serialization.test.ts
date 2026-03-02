import { describe, it, expect } from 'vitest';
import { Serializer } from '../src/serialization.js';
import { GoalClass } from '../src/goal.js';
import { IntentGraphClass } from '../src/intent-graph.js';

describe('Serializer', () => {
  it('should serialize goal to JSON string', () => {
    const goal = GoalClass.create({
      title: 'Test Goal',
      status: 'active',
      priority: { level: 'medium' }
    });

    const json = Serializer.goalToJSON(goal);
    expect(json).toBeDefined();
    expect(typeof json).toBe('string');
    expect(json).toContain('Test Goal');
  });

  it('should deserialize goal from JSON string', () => {
    const original = GoalClass.create({
      title: 'Test Goal',
      status: 'active',
      priority: { level: 'medium' }
    });

    const json = Serializer.goalToJSON(original);
    const deserialized = Serializer.goalFromJSON(json);

    expect(deserialized.id).toBe(original.id);
    expect(deserialized.title).toBe(original.title);
  });

  it('should convert goal to JSON-LD', () => {
    const goal = GoalClass.create({
      title: 'Test Goal',
      status: 'active',
      priority: { level: 'medium' }
    });

    const jsonld = Serializer.goalToJSONLD(goal);
    expect(jsonld['@context']).toBeDefined();
    expect(jsonld['@type']).toBe('Goal');
    expect(jsonld.name).toBe('Test Goal');
  });

  it('should serialize graph to JSON string', () => {
    const graph = IntentGraphClass.create('user123', 'Test Graph');
    graph.addGoal({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const json = Serializer.graphToJSON(graph.toJSON());
    expect(json).toBeDefined();
    expect(typeof json).toBe('string');
    expect(json).toContain('Test Graph');
  });

  it('should deserialize graph from JSON string', () => {
    const graph = IntentGraphClass.create('user123', 'Test Graph');
    const goal = graph.addGoal({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const json = Serializer.graphToJSON(graph.toJSON());
    const deserialized = Serializer.graphFromJSON(json);

    expect(deserialized.id).toBe(graph.toJSON().id);
    expect(deserialized.goals).toHaveLength(1);
  });

  it('should convert graph to JSON-LD', () => {
    const graph = IntentGraphClass.create('user123', 'Test Graph');
    const jsonld = Serializer.graphToJSONLD(graph.toJSON());

    expect(jsonld['@context']).toBeDefined();
    expect(jsonld['@type']).toBe('IntentGraph');
  });

  it('should compact JSON', () => {
    const goal = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const compact = Serializer.compact(goal);
    expect(compact).toBeDefined();
    expect(compact.includes('\n')).toBe(false);
  });

  it('should format JSON with indentation', () => {
    const goal = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const formatted = Serializer.format(goal, 2);
    expect(formatted).toBeDefined();
    expect(formatted.includes('\n')).toBe(true);
  });

  it('should export goal as CSV', () => {
    const goal = GoalClass.create({
      title: 'Test Goal',
      status: 'active',
      priority: { level: 'medium' },
      domain: 'work'
    });

    const csv = Serializer.goalToCSV(goal);
    expect(csv).toBeDefined();
    expect(csv).toContain('Test Goal');
  });

  it('should export graph as CSV', () => {
    const graph = IntentGraphClass.create('user123');
    graph.addGoal({
      title: 'Goal 1',
      status: 'active',
      priority: { level: 'medium' }
    });

    const csv = Serializer.graphToCSV(graph.toJSON());
    expect(csv).toBeDefined();
    expect(csv).toContain('Goal 1');
    expect(csv.split('\n').length).toBeGreaterThan(1);
  });

  it('should clone goal via serialization', () => {
    const original = GoalClass.create({
      title: 'Original',
      status: 'active',
      priority: { level: 'medium' }
    });

    const cloned = Serializer.cloneGoal(original);
    expect(cloned.id).toBe(original.id);
    expect(cloned.title).toBe(original.title);

    cloned.title = 'Modified';
    expect(original.title).toBe('Original');
  });

  it('should clone graph via serialization', () => {
    const original = IntentGraphClass.create('user123');
    original.addGoal({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const cloned = Serializer.cloneGraph(original.toJSON());
    expect(cloned.id).toBe(original.toJSON().id);
    expect(cloned.goals).toHaveLength(1);
  });

  it('should get goal size in bytes', () => {
    const goal = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const size = Serializer.getGoalSize(goal);
    expect(size).toBeGreaterThan(0);
  });

  it('should get graph size in bytes', () => {
    const graph = IntentGraphClass.create('user123');
    graph.addGoal({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const size = Serializer.getGraphSize(graph.toJSON());
    expect(size).toBeGreaterThan(0);
  });

  it('should check if goals are equal', () => {
    const goal1 = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const goal2 = Serializer.cloneGoal(goal1);
    expect(Serializer.goalsEqual(goal1, goal2)).toBe(true);

    const goal3 = GoalClass.create({
      title: 'Different',
      status: 'active',
      priority: { level: 'medium' }
    });

    expect(Serializer.goalsEqual(goal1, goal3)).toBe(false);
  });

  it('should diff goals', () => {
    const goal1 = GoalClass.create({
      title: 'Original',
      status: 'active',
      priority: { level: 'medium' }
    });

    const goal2 = GoalClass.update(goal1, {
      title: 'Modified',
      status: 'completed'
    });

    const diff = Serializer.diffGoals(goal1, goal2);
    expect(diff.title).toBeDefined();
    expect(diff.status).toBeDefined();
    expect(diff.title.old).toBe('Original');
    expect(diff.title.new).toBe('Modified');
  });

  it('should handle pretty printing', () => {
    const goal = GoalClass.create({
      title: 'Test',
      status: 'active',
      priority: { level: 'medium' }
    });

    const pretty = Serializer.goalToJSON(goal, true);
    const compact = Serializer.goalToJSON(goal, false);

    expect(pretty.length).toBeGreaterThan(compact.length);
    expect(pretty.includes('\n')).toBe(true);
    expect(compact.includes('\n')).toBe(false);
  });

  it('should preserve all goal fields during serialization', () => {
    const goal = GoalClass.create({
      title: 'Complete Goal',
      description: 'Full description',
      status: 'active',
      priority: { level: 'high', reason: 'Important' },
      domain: 'work',
      tags: ['tag1', 'tag2'],
      deadline: '2025-12-31T23:59:59Z',
      successCriteria: ['Done', 'Tested'],
      motivation: 'To succeed',
      metadata: { custom: 'value' }
    });

    const json = Serializer.goalToJSON(goal);
    const restored = Serializer.goalFromJSON(json);

    expect(restored.description).toBe(goal.description);
    expect(restored.domain).toBe(goal.domain);
    expect(restored.tags).toEqual(goal.tags);
    expect(restored.successCriteria).toEqual(goal.successCriteria);
  });
});
