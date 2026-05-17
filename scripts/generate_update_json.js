const fs = require('fs');
const path = require('path');

// This script generates the update.json for Tauri's auto-updater.
// It searches the downloaded artifacts for the cryptographic signature files (.sig)
// and maps them to their respective platform download URLs in the Ater_Releases repo.

const ORG = 'DagimAlemayehuu';
const REPO = 'Ater_Releases';
const VERSION = process.argv[2] || '0.1.0';

const platforms = {
  'darwin-aarch64': {
    sigPattern: /Ater_.*_aarch64\.app\.tar\.gz\.sig$/,
    artifactPattern: /Ater_.*_aarch64\.app\.tar\.gz$/,
    urlName: `Ater_${VERSION}_aarch64.app.tar.gz`
  },
  'darwin-x86_64': {
    sigPattern: /Ater_.*_x64\.app\.tar\.gz\.sig$/,
    artifactPattern: /Ater_.*_x64\.app\.tar\.gz$/,
    urlName: `Ater_${VERSION}_x64.app.tar.gz`
  },
  'windows-x86_64': {
    sigPattern: /Ater_.*_x64-setup\.nsis\.zip\.sig$/,
    artifactPattern: /Ater_.*_x64-setup\.nsis\.zip$/,
    urlName: `Ater_${VERSION}_x64-setup.nsis.zip`
  }
};

const updateJson = {
  version: VERSION,
  notes: `Release Ater v${VERSION}`,
  pub_date: new Date().toISOString(),
  platforms: {}
};

// Helper function to recursively find files matching a pattern
function findFile(dir, pattern) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const found = findFile(fullPath, pattern);
      if (found) return found;
    } else if (pattern.test(file)) {
      return fullPath;
    }
  }
  return null;
}

const artifactsDir = path.join(process.cwd(), 'artifacts');
console.log(`Scanning for signature files in: ${artifactsDir}`);

Object.keys(platforms).forEach(platformKey => {
  const { sigPattern, urlName } = platforms[platformKey];
  
  // Attempt to locate the signature file in the artifacts directory
  const sigFilePath = findFile(artifactsDir, sigPattern);
  let signature = '';

  if (sigFilePath) {
    console.log(`Found signature file for ${platformKey} at: ${sigFilePath}`);
    signature = fs.readFileSync(sigFilePath, 'utf-8').trim();
  } else {
    console.warn(`⚠️ Warning: No signature file found matching pattern ${sigPattern} for ${platformKey}. Using placeholder.`);
    signature = 'PLACEHOLDER_SIGNATURE';
  }

  updateJson.platforms[platformKey] = {
    signature: signature,
    url: `https://github.com/${ORG}/${REPO}/releases/download/v${VERSION}/${urlName}`
  };
});

fs.writeFileSync('update.json', JSON.stringify(updateJson, null, 2));
console.log('✅ Generated update.json contents:');
console.log(JSON.stringify(updateJson, null, 2));
