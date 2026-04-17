import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoId = process.argv[2] || 'AbteeXAILab/GoalOS';
const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), '..');
const spaceRoot = path.join(root, 'hf', 'space');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

run(process.execPath, [path.join(root, 'scripts', 'verify-hf-space.mjs')], { cwd: root });
run('hf', ['repos', 'create', repoId, '--type', 'space', '--space-sdk', 'static', '--public', '--exist-ok'], { cwd: root });
run('hf', ['upload', repoId, '.', '.', '--repo-type', 'space', '--commit-message', 'Deploy GoalOS by AbteeX AI Labs Space'], { cwd: spaceRoot });

console.log(`Published Hugging Face Space: https://huggingface.co/spaces/${repoId}`);
