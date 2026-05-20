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
    // macOS Silicon signature pattern - be more lenient with case and naming
    sigPattern: /aarch64\.app\.tar\.gz\.sig$|Ater\.app\.tar\.gz\.sig$/i,
    urlName: `Ater_${VERSION}_aarch64.app.tar.gz`
  },
  'windows-x86_64': {
    // Windows x64 signature pattern
    sigPattern: /x64-setup\.nsis\.zip\.sig$|x64\.nsis\.zip\.sig$|Ater\.zip\.sig$/i,
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
  const { sigPattern, urlName } = platforms[platformKey];
  
  // Attempt to locate the signature file in the artifacts directory
  const sigFilePath = findFile(artifactsDir, sigPattern);
  let signature = '';

  if (sigFilePath) {
    console.log(`✅ Found signature file for ${platformKey} at: ${sigFilePath}`);
    signature = fs.readFileSync(sigFilePath, 'utf-8').trim();
    
    // If the signature file contains multiple lines (e.g. minisign output), 
    // we only want the actual signature part if it's not a single line.
    // However, Tauri's .sig files are usually just the base64 signature.
  } else {
    console.warn(`⚠️ Warning: Missing updater signature for ${platformKey}. Expected a file matching ${sigPattern}.`);
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
