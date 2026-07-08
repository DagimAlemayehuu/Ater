const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const workflow = fs.readFileSync(path.resolve(__dirname, '..', '.github', 'workflows', 'release.yml'), 'utf8');

test('release workflow verifies and uploads the Tauri artifacts produced in CI', () => {
  assert.match(workflow, /\*\.exe\.sig/);
  assert.match(workflow, /\*\.msi\.sig/);
  assert.match(workflow, /\*\.AppImage\.sig/);
  assert.match(workflow, /\*\.deb\.sig/);
  assert.match(workflow, /Ater_\$\{TAG#v\}_x64-setup\.exe/);
  assert.match(workflow, /Ater_\$\{TAG#v\}_x86_64\.AppImage/);

  assert.doesNotMatch(workflow, /x64-setup\.nsis\.zip/);
  assert.doesNotMatch(workflow, /AppImage\.tar\.gz/);
});

test('release workflow creates a tag in the release repository before uploading assets', () => {
  assert.match(workflow, /refs\/tags\/\$\{tag\}/);
  assert.match(workflow, /github\.rest\.git\.createRef/);
});
