const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { execFileSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(repoRoot, 'scripts', 'generate_update_json.js');

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

test('generates updater manifest from current Tauri release artifact names', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ater-update-json-'));

  writeFile(path.join(tmp, 'artifacts', 'signatures-macos-aarch64', 'Ater.app.tar.gz.sig'), 'mac-signature');
  writeFile(path.join(tmp, 'artifacts', 'signatures-windows-x86_64', 'Ater_0.2.0_x64-setup.exe.sig'), 'windows-signature');
  writeFile(path.join(tmp, 'artifacts', 'signatures-linux-x86_64', 'Ater_0.2.0_amd64.AppImage.sig'), 'linux-signature');
  writeFile(
    path.join(tmp, 'release-assets.json'),
    JSON.stringify({
      assets: [
        { name: 'Ater_0.2.0_aarch64.app.tar.gz' },
        { name: 'Ater_0.2.0_x64-setup.exe' },
        { name: 'Ater_0.2.0_x86_64.AppImage' },
      ],
    }),
  );

  execFileSync(process.execPath, [scriptPath, '0.2.0', '--assets', path.join(tmp, 'release-assets.json')], {
    cwd: tmp,
    env: {
      ...process.env,
      GITHUB_REPOSITORY: 'DagimAlemayehuu/Ater_Releases',
    },
    stdio: 'pipe',
  });

  const manifest = JSON.parse(fs.readFileSync(path.join(tmp, 'update.json'), 'utf8'));

  assert.equal(manifest.platforms['darwin-aarch64'].signature, 'mac-signature');
  assert.equal(
    manifest.platforms['darwin-aarch64'].url,
    'https://github.com/DagimAlemayehuu/Ater_Releases/releases/download/v0.2.0/Ater_0.2.0_aarch64.app.tar.gz',
  );
  assert.equal(manifest.platforms['windows-x86_64'].signature, 'windows-signature');
  assert.equal(
    manifest.platforms['windows-x86_64'].url,
    'https://github.com/DagimAlemayehuu/Ater_Releases/releases/download/v0.2.0/Ater_0.2.0_x64-setup.exe',
  );
  assert.equal(manifest.platforms['linux-x86_64'].signature, 'linux-signature');
  assert.equal(
    manifest.platforms['linux-x86_64'].url,
    'https://github.com/DagimAlemayehuu/Ater_Releases/releases/download/v0.2.0/Ater_0.2.0_x86_64.AppImage',
  );
});
