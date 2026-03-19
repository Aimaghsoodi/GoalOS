import { dirname, join } from 'path';
import { describe, expect, it } from 'vitest';
import { getDefaultConfig, getGraphDir, getGraphPath } from '../src/config.js';

describe('CLI config', () => {
  it('uses graph.json under the goalos config directory by default', () => {
    const config = getDefaultConfig();

    expect(getGraphPath(config)).toBe(config.graphPath);
    expect(getGraphPath(config)).toContain(join('.goalos', 'graph.json'));
  });

  it.each([
    ['POSIX', '/Users/alice/.goalos/graph.json', '/Users/alice/.goalos'],
    ['Windows', 'C:\\Users\\alice\\.goalos\\graph.json', 'C:\\Users\\alice\\.goalos']
  ])('returns the parent directory for %s graph paths', (_label, graphPath, expected) => {
    expect(getGraphDir({ graphPath })).toBe(expected);
  });

  it('matches Node dirname semantics for relative paths', () => {
    const graphPath = 'graph.json';

    expect(getGraphDir({ graphPath })).toBe(dirname(graphPath));
  });
});
