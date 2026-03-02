/**
 * GoalOS API on Cloudflare Workers
 * Expose intent graph queries via REST API
 */

import { IntentGraph } from '@goalos/core';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Route requests
    if (path.startsWith('/api/goals')) {
      if (path.match(/^\/api\/goals\/[^/]+$/)) {
        return await handleGetGoal(request, env);
      } else if (path.match(/^\/api\/goals\/[^/]+\/blockers$/)) {
        return await handleGetBlockers(request, env);
      } else {
        return await handleListGoals(request, env);
      }
    } else if (path === '/api/context') {
      return await handleGetContext(request, env);
    } else if (path === '/api/search') {
      return await handleSearch(request, env);
    } else if (path === '/api/deadlines') {
      return await handleGetDeadlines(request, env);
    } else if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }
  }
};

interface Env {
  GOALOS_BUCKET?: R2Bucket;
  ENVIRONMENT?: string;
}

async function loadGraph(env: Env): Promise<IntentGraph> {
  if (env.GOALOS_BUCKET) {
    const obj = await env.GOALOS_BUCKET.get('graph.json');
    if (!obj) throw new Error('Graph not found');
    const json = await obj.json();
    return IntentGraph.fromJSON(json);
  } else {
    // For development, return sample graph
    return IntentGraph.create('example-user', 'Development Graph');
  }
}

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleGetContext(request: Request, env: Env): Promise<Response> {
  try {
    const graph = await loadGraph(env);
    const stats = graph.getStats();
    const top = graph.getTopPriorities(3);
    const blocked = graph.getByStatus('blocked');

    return jsonResponse({
      totalGoals: stats.totalGoals,
      activeGoals: stats.byStatus.active || 0,
      completionRate: graph.getCompletionRate(),
      topPriorities: top.map(g => ({
        id: g.id,
        title: g.title,
        priority: g.priority.level,
        deadline: g.deadline
      })),
      blockedCount: blocked.length
    });
  } catch (error) {
    return jsonResponse({ error: String(error) }, 500);
  }
}

async function handleListGoals(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const domain = url.searchParams.get('domain');
    const priority = url.searchParams.get('priority');

    const graph = await loadGraph(env);
    let goals = graph.goals;

    if (status) goals = goals.filter(g => g.status === status);
    if (domain) goals = goals.filter(g => g.domain === domain);
    if (priority) goals = goals.filter(g => g.priority.level === priority);

    return jsonResponse({
      count: goals.length,
      goals: goals.map(g => ({
        id: g.id,
        title: g.title,
        status: g.status,
        priority: g.priority.level,
        deadline: g.deadline,
        domain: g.domain
      }))
    });
  } catch (error) {
    return jsonResponse({ error: String(error) }, 500);
  }
}

async function handleGetGoal(request: Request, env: Env): Promise<Response> {
  try {
    const goalId = new URL(request.url).pathname.split('/')[3];
    const graph = await loadGraph(env);
    const goal = graph.getGoal(goalId);

    if (!goal) {
      return jsonResponse({ error: 'Goal not found' }, 404);
    }

    const children = graph.getChildren(goalId);
    const blockers = graph.getBlockers(goalId);

    return jsonResponse({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      priority: goal.priority,
      deadline: goal.deadline,
      successCriteria: goal.successCriteria,
      motivation: goal.motivation,
      domain: goal.domain,
      children: children.map(c => ({ id: c.id, title: c.title })),
      blockers: blockers.map(b => ({ id: b.id, title: b.title }))
    });
  } catch (error) {
    return jsonResponse({ error: String(error) }, 500);
  }
}

async function handleGetBlockers(request: Request, env: Env): Promise<Response> {
  try {
    const goalId = new URL(request.url).pathname.split('/')[3];
    const graph = await loadGraph(env);
    const blockers = graph.getBlockers(goalId);

    return jsonResponse({
      goalId,
      blockerCount: blockers.length,
      blockers: blockers.map(b => ({
        id: b.id,
        title: b.title,
        status: b.status,
        priority: b.priority.level
      }))
    });
  } catch (error) {
    return jsonResponse({ error: String(error) }, 500);
  }
}

async function handleSearch(request: Request, env: Env): Promise<Response> {
  try {
    const query = new URL(request.url).searchParams.get('q') || '';
    const graph = await loadGraph(env);

    const results = graph.goals.filter(g =>
      g.title.toLowerCase().includes(query.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(query.toLowerCase()))
    );

    return jsonResponse({
      query,
      resultCount: results.length,
      results: results.map(g => ({
        id: g.id,
        title: g.title,
        status: g.status,
        domain: g.domain
      }))
    });
  } catch (error) {
    return jsonResponse({ error: String(error) }, 500);
  }
}

async function handleGetDeadlines(request: Request, env: Env): Promise<Response> {
  try {
    const daysAhead = parseInt(new URL(request.url).searchParams.get('daysAhead') || '7');
    const graph = await loadGraph(env);

    const now = new Date();
    const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const upcoming = graph.goals
      .filter(g => g.deadline)
      .filter(g => {
        const deadline = new Date(g.deadline!);
        return deadline >= now && deadline <= cutoff;
      })
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

    return jsonResponse({
      daysAhead,
      deadlineCount: upcoming.length,
      deadlines: upcoming.map(g => ({
        id: g.id,
        title: g.title,
        deadline: g.deadline,
        priority: g.priority.level
      }))
    });
  } catch (error) {
    return jsonResponse({ error: String(error) }, 500);
  }
}
