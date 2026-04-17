import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const spaceRoot = path.join(root, 'hf', 'space');

const requiredFiles = [
  'README.md',
  'index.html',
  path.join('docs', 'index.html'),
  path.join('assets', 'styles.css'),
  path.join('assets', 'app.js'),
];

const readmePath = path.join(spaceRoot, 'README.md');
const htmlFiles = [
  path.join(spaceRoot, 'index.html'),
  path.join(spaceRoot, 'docs', 'index.html'),
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function checkLocalLinks(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const regex = /(href|src)="([^"]+)"/g;
  const issues = [];
  for (const match of source.matchAll(regex)) {
    const target = match[2];
    if (
      target.startsWith('http://') ||
      target.startsWith('https://') ||
      target.startsWith('#') ||
      target.startsWith('mailto:') ||
      target.startsWith('data:')
    ) {
      continue;
    }

    const resolved = path.resolve(path.dirname(filePath), target);
    if (!fs.existsSync(resolved)) {
      issues.push(`${path.relative(root, filePath)} -> ${target}`);
    }
  }
  return issues;
}

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(spaceRoot, relativePath);
  assert(fs.existsSync(absolutePath), `Missing required Space file: ${relativePath}`);
}

const readme = fs.readFileSync(readmePath, 'utf8');
assert(readme.startsWith('---'), 'Space README must start with Hugging Face YAML frontmatter.');
assert(readme.includes('sdk: static'), 'Space README frontmatter must declare `sdk: static`.');
assert(readme.includes('app_file: index.html'), 'Space README frontmatter must declare `app_file: index.html`.');

const brokenLinks = htmlFiles.flatMap(checkLocalLinks);
assert(brokenLinks.length === 0, `Broken local links found:\n${brokenLinks.join('\n')}`);

console.log('HF Space verification passed.');
