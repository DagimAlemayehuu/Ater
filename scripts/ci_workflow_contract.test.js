const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ciWorkflow = fs.readFileSync(path.resolve(__dirname, '..', '.github', 'workflows', 'ci.yml'), 'utf8');
const platformWorkflow = fs.readFileSync(
  path.resolve(__dirname, '..', '.github', 'workflows', 'platform-validation.yml'),
  'utf8',
);
const releaseWorkflow = fs.readFileSync(path.resolve(__dirname, '..', '.github', 'workflows', 'release.yml'), 'utf8');

test('fast Gatekeeper CI stays scoped to PR and branch pushes, not main pushes', () => {
  assert.match(ciWorkflow, /pull_request:/);
  assert.match(ciWorkflow, /branches-ignore:\s*\[\s*"main"\s*\]/);
  assert.match(ciWorkflow, /name:\s*Gatekeeper Required/);
  assert.doesNotMatch(ciWorkflow, /cargo build --manifest-path .* --release/);
  assert.doesNotMatch(ciWorkflow, /cargo test --manifest-path/);
  assert.doesNotMatch(ciWorkflow, /windows-latest/);
  assert.doesNotMatch(ciWorkflow, /macos-latest|macos-14/);
});

test('platform validation owns main push and full cross-platform checks', () => {
  assert.match(platformWorkflow, /push:\s*\n\s*branches:\s*\[\s*"main"\s*\]/);
  assert.match(platformWorkflow, /name:\s*Platform Validation Required/);
  assert.match(platformWorkflow, /macos-14/);
  assert.match(platformWorkflow, /windows-latest/);
  assert.match(platformWorkflow, /ubuntu-latest/);
  assert.match(platformWorkflow, /cargo build --manifest-path .* --release/);
});

test('release packaging remains tag-driven and separate from CI validation', () => {
  assert.match(releaseWorkflow, /tags:\s*\n\s*-\s*'v\*'/);
  assert.match(releaseWorkflow, /Build Python Sidecar \(PyInstaller\)/);
  assert.match(releaseWorkflow, /Build and Package Tauri App/);
});
