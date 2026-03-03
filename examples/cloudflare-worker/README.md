# Cloudflare Workers + GoalOS

Deploy a serverless GoalOS API on Cloudflare Workers. This enables:

- Query your intent graph via HTTP API
- Share goal data safely with other services
- Integrate with third-party applications
- Global edge-cached goal queries

## What This Does

- REST API endpoints for goal queries (read-only by default)
- Direct integration with R2 for goal storage
- Durable Objects for multi-user goal graphs
- Sub-request routing and caching

## Prerequisites

- Wrangler CLI installed (`npm install -g wrangler`)
- Cloudflare account (free tier supported)
- (Optional) Cloudflare R2 bucket for storage

## Setup

### 1. Initialize Wrangler Project

```bash
cd examples/cloudflare-worker
npm install
```

### 2. Configure wrangler.toml

Edit `wrangler.toml`:

```toml
name = "goalos-api"
type = "javascript"
account_id = "your-account-id"
workers_dev = true

[env.production]
name = "goalos-api-prod"
```

### 3. Deploy

```bash
wrangler deploy
```

Get your API URL: `https://goalos-api.<your-subdomain>.workers.dev`

## API Endpoints

### Get Goal Context

```bash
GET /api/context
```

Response:
```json
{
  "totalGoals": 25,
  "activeGoals": 12,
  "completionRate": 0.48,
  "topPriorities": [...]
}
```

### List Goals

```bash
GET /api/goals?status=active&domain=work
```

Query Parameters:
- `status`: active, planned, blocked, completed
- `domain`: work, personal, health, creative, etc.
- `priority`: critical, high, medium, low, someday

### Get Goal Details

```bash
GET /api/goals/:goalId
```

### Search Goals

```bash
GET /api/search?q=launch
```

### Get Blockers

```bash
GET /api/goals/:goalId/blockers
```

### Get Deadlines

```bash
GET /api/deadlines?daysAhead=7
```

## Usage Examples

### Query from JavaScript

```javascript
const response = await fetch('https://your-worker.workers.dev/api/goals');
const goals = await response.json();
console.log(goals);
```

### Query from Python

```python
import requests

response = requests.get('https://your-worker.workers.dev/api/context')
context = response.json()
print(context['topPriorities'])
```

### Query from cURL

```bash
curl https://your-worker.workers.dev/api/goals?status=active
curl https://your-worker.workers.dev/api/search?q=launch
```

## Storage Options

### Option 1: File System (Development)

Store intent graph in project directory:

```toml
[env.development]
name = "goalos-api-dev"
env = "development"
```

### Option 2: R2 Object Storage

Store in Cloudflare R2 bucket:

```toml
[[r2_buckets]]
binding = "GOALOS_BUCKET"
bucket_name = "goalos-graphs"
```

```typescript
const graph = await env.GOALOS_BUCKET.get('graph.json');
```

### Option 3: Durable Objects (Multi-User)

Use Durable Objects for multi-tenant graph storage:

```typescript
export class GoalGraphDO extends DurableObject {
  async fetch(request: Request) {
    // Handle requests per user graph
  }
}
```

## Authentication

Add authentication for write operations:

```typescript
const token = request.headers.get('Authorization');
if (!token || !verifyToken(token)) {
  return new Response('Unauthorized', { status: 401 });
}
```

Verify API key:

```bash
curl -H "Authorization: Bearer your-api-key" \
  https://your-worker.workers.dev/api/goals
```

## Caching

Cache goal queries for performance:

```typescript
const cacheKey = new Request(url, { method: 'GET' });
const cached = await caches.default.match(cacheKey);

if (cached) return cached;

const response = await fetch(...);
await caches.default.put(cacheKey, response.clone());
return response;
```

## Cost

- Requests: 100k/day free (then $0.50/million)
- R2 Storage: 10 GB/month free
- Durable Objects: $5/month per object

Typical cost: $0-1/month for personal use.

## Deployment to Production

### Environment Variables

Set secrets for production:

```bash
wrangler secret put GOALOS_API_KEY
wrangler secret put GOALOS_BUCKET_NAME
```

Access in code:

```typescript
const apiKey = env.GOALOS_API_KEY;
```

### Production Build

```bash
wrangler deploy --env production
```

## Local Development

Run locally:

```bash
wrangler dev
```

Test endpoints:

```bash
curl http://localhost:8787/api/goals
```

## Advanced: Sync with Desktop App

Sync goals between Cloudflare Workers and local GoalOS:

```typescript
// Push local graph to Worker
const graph = IntentGraph.from_file('~/.goalos/graph.json');
await fetch('https://api.goalos.dev/api/sync', {
  method: 'POST',
  body: JSON.stringify(graph.toJSON()),
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## Monitoring

Monitor Worker performance:

```bash
wrangler tail  # Stream logs
wrangler publish --compatibility-date 2024-01-01
```

View metrics in Cloudflare Dashboard.

## Limitations

- Max request size: 128 MB
- Max response size: 128 MB
- Max execution time: 30 seconds (CPU time)
- Cold start: ~5ms

For larger graphs, paginate results:

```typescript
// Paginate 50 goals per request
const page = params.get('page') || '0';
const offset = parseInt(page) * 50;
const goals = allGoals.slice(offset, offset + 50);
```

## Next Steps

- Implement write operations (add/update/complete goals)
- Add authentication and user isolation
- Set up continuous sync with local graphs
- Create webhooks for goal changes
- Build dashboard in Next.js/Vue

## Support

Issues or questions:
- GitHub: https://github.com/Aimaghsoodi/GoalOS/issues
- Wrangler Docs: https://developers.cloudflare.com/workers/
