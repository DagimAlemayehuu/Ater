const MANIFEST_URL = 'https://github.com/DagimAlemayehuu/Ater_Releases/releases/latest/download/update.json';
const EXPECTED_VERSION = '0.2.0';

async function verifyRelease() {
  let manifest;
  const localFile = process.argv[2];

  if (localFile) {
    console.log(`Reading manifest from local file: ${localFile}...`);
    const fs = require('fs');
    manifest = JSON.parse(fs.readFileSync(localFile, 'utf8'));
  } else {
    console.log(`Fetching manifest from ${MANIFEST_URL}...`);
    try {
      const response = await fetch(MANIFEST_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
      }
      manifest = await response.json();
      console.log('Manifest fetched successfully.');
    } catch (err) {
      throw new Error(`Fetch failed: ${err.message}`);
    }
  }

  try {
    // 1. Confirm version
    if (manifest.version !== EXPECTED_VERSION) {
      throw new Error(`Version mismatch. Expected ${EXPECTED_VERSION}, got ${manifest.version}`);
    }
    console.log(`✓ Version matches ${EXPECTED_VERSION}`);

    // 2. Verify platforms
    const platforms = manifest.platforms;
    if (!platforms) {
      throw new Error('No platforms found in manifest');
    }

    const requiredPlatforms = ['windows-x86_64', 'linux-x86_64'];
    const macPlatforms = ['darwin-aarch64', 'darwin-x86_64'];

    for (const p of requiredPlatforms) {
      if (!platforms[p]) {
        throw new Error(`Missing required platform: ${p}`);
      }
      verifyPlatform(p, platforms[p]);
    }

    const hasMac = macPlatforms.some(p => platforms[p]);
    if (!hasMac) {
      throw new Error(`Missing at least one macOS platform: ${macPlatforms.join(' or ')}`);
    }

    for (const p of macPlatforms) {
      if (platforms[p]) {
        verifyPlatform(p, platforms[p]);
      }
    }

    console.log('✓ All required platforms are present and valid.');
    console.log('Release verification SUCCESSFUL.');
  } catch (err) {
    console.error('Verification FAILED:', err.message);
    process.exit(1);
  }
}

function verifyPlatform(name, data) {
  console.log(`Verifying platform: ${name}...`);
  if (!data.signature) {
    throw new Error(`Missing signature for platform ${name}`);
  }
  if (data.signature.trim() === '') {
    throw new Error(`Empty signature for platform ${name}`);
  }

  // Verify base64 characters
  if (!/^[A-Za-z0-9+/=]+$/.test(data.signature.trim())) {
      throw new Error(`Invalid base64 characters in signature for platform ${name}`);
  }

  // Try to decode
  try {
    Buffer.from(data.signature, 'base64');
  } catch (e) {
    throw new Error(`Invalid base64 signature for platform ${name}: ${e.message}`);
  }

  console.log(`  ✓ ${name} signature is present and appears to be valid base64.`);
}

verifyRelease();
