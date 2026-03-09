#!/usr/bin/env node
/**
 * Guardrail: fail if hardcoded visual values appear outside approved token files.
 * See shared/design-tokens/CONTRACT.md.
 * Run from repo root: node scripts/check-design-tokens.js
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const APPROVED = [
  'landing-page/src/styles.css',
  'admin-web/tailwind.config.js',
  'admin-web/src/styles.css',
  'mobile/src/utils/theme.ts',
  'mobile/src/utils/layout.ts',
].map((p) => path.join(root, p).replace(/\\/g, '/'));

function* walk(dir, ext) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') {
      yield* walk(full, ext);
    } else if (e.isFile() && ext.some((x) => e.name.endsWith(x))) {
      yield full.replace(/\\/g, '/');
    }
  }
}

function isApproved(file) {
  return APPROVED.some((a) => file === a || file.startsWith(a + path.sep));
}

let failed = false;

// Check mobile: literal 'white' or 'transparent' in style props
for (const file of walk(path.join(root, 'mobile', 'src'), ['.ts', '.tsx'])) {
  if (isApproved(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const bad = content.match(/(?:backgroundColor|borderColor):\s*['"](?:white|transparent)['"]/g);
  if (bad) {
    console.error(`FAIL ${path.relative(root, file)}: literal color in style – use colors.* from theme`);
    failed = true;
  }
}

// Check admin-web: arbitrary Tailwind brackets
for (const file of walk(path.join(root, 'admin-web', 'src'), ['.tsx', '.jsx'])) {
  const content = fs.readFileSync(file, 'utf8');
  const bad = content.match(/(?:rounded|text|w|h|min-h|max-w|p|m|gap)-\[[^\]]+\]/g);
  if (bad) {
    console.error(`FAIL ${path.relative(root, file)}: arbitrary Tailwind – use theme classes`);
    failed = true;
  }
}

// Check landing TS/TSX: hex colors (excluding comments and string in theme)
for (const file of walk(path.join(root, 'landing-page', 'src'), ['.ts', '.tsx'])) {
  const content = fs.readFileSync(file, 'utf8');
  const hex = content.match(/#[0-9A-Fa-f]{6}\b/g);
  if (hex && !content.includes('styles.css')) {
    console.error(`FAIL ${path.relative(root, file)}: hex color – use CSS vars`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log('Design token check passed.');
