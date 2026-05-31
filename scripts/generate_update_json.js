const fs = require('fs');
const path = require('path');

// This script generates the update.json for Tauri's auto-updater.
// It searches the downloaded artifacts for the cryptographic signature files (.sig)
// and maps them to their respective platform download URLs in the Ater_Releases repo.

const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'DagimAlemayehuu/Ater_Releases';
const [ORG, REPO] = GITHUB_REPOSITORY.split('/');
const VERSION = process.argv[2] || '0.1.0';

const platforms = {
  'darwin-aarch64': {
    artifactDirName: 'signatures-macos-aarch64',
    sigPattern: /\.sig$/i,
    fallbackPattern: /aarch64\.app\.tar\.gz\.sig$|Ater\.app\.tar\.gz\.sig$/i,
    urlName: `Ater_${VERSION}_aarch64.app.tar.gz`
  },
  'windows-x86_64': {
    artifactDirName: 'signatures-windows-x86_64',
    sigPattern: /\.sig$/i,
    fallbackPattern: /x64-setup\.nsis\.zip\.sig$|x64\.nsis\.zip\.sig$|Ater\.zip\.sig$/i,
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

// Helper to log all files in artifacts for debugging
function logDirectory(dir, indent = '') {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      console.log(`${indent}[DIR] ${file}`);
      logDirectory(fullPath, indent + '  ');
    } else {
      console.log(`${indent}${file}`);
    }
  }
}

const artifactsDir = path.join(process.cwd(), 'artifacts');
console.log(`Scanning for signature files in: ${artifactsDir}`);
logDirectory(artifactsDir);

Object.keys(platforms).forEach(platformKey => {
  const { artifactDirName, sigPattern, fallbackPattern, urlName } = platforms[platformKey];
  
  // 1. First search inside the dedicated downloaded artifact subfolder
  const specificDir = path.join(artifactsDir, artifactDirName);
  let sigFilePath = findFile(specificDir, sigPattern);
  
  // 2. If not found in the dedicated folder, search the general artifacts directory using fallback pattern
  if (!sigFilePath) {
    console.log(`ℹ️ Did not find signature file in dedicated ${artifactDirName} folder. Searching general artifacts folder...`);
    sigFilePath = findFile(artifactsDir, fallbackPattern);
  }
  
  let signature = '';

  if (sigFilePath) {
    console.log(`✅ Found signature file for ${platformKey} at: ${sigFilePath}`);
    signature = fs.readFileSync(sigFilePath, 'utf-8').trim();
  } else {
    console.warn(`⚠️ Warning: Missing updater signature for ${platformKey}. Checked both ${specificDir} and fallback matching ${fallbackPattern}.`);
    // Instead of throwing, we'll log it. If we have NO platforms, the update.json will just be empty for platforms.
    // This allows the CI to finish even if one platform fails, though we want both.
    return;
  }

  updateJson.platforms[platformKey] = {
    signature: signature,
    url: `https://github.com/${ORG}/${REPO}/releases/download/v${VERSION}/${urlName}`
  };
});

fs.writeFileSync('update.json', JSON.stringify(updateJson, null, 2));
console.log('✅ Generated update.json:');
console.log(JSON.stringify(updateJson, null, 2));
