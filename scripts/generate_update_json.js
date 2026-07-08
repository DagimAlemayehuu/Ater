const fs = require('fs');
const path = require('path');

// This script generates the update.json for Tauri's auto-updater.
// It searches the downloaded artifacts for the cryptographic signature files (.sig)
// and maps them to their respective platform download URLs in the Ater_Releases repo.

const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'DagimAlemayehuu/Ater_Releases';
const [ORG, REPO] = GITHUB_REPOSITORY.split('/');
const VERSION = process.argv[2] || '0.1.0';
const assetsArgIndex = process.argv.indexOf('--assets');
const assetsJsonPath = assetsArgIndex >= 0 ? process.argv[assetsArgIndex + 1] : process.env.RELEASE_ASSETS_JSON;

const platforms = {
  'darwin-aarch64': {
    artifactDirName: 'signatures-macos-aarch64',
    sigPattern: /\.sig$/i,
    fallbackPattern: /aarch64\.app\.tar\.gz\.sig$|Ater\.app\.tar\.gz\.sig$/i,
    urlName: `Ater_${VERSION}_aarch64.app.tar.gz`
  },
  'windows-x86_64': {
    artifactDirName: 'signatures-windows-x86_64',
    sigPattern: /x64-setup\.exe\.sig$/i,
    fallbackPattern: /x64-setup\.exe\.sig$/i,
    urlName: `Ater_${VERSION}_x64-setup.exe`
  },
  'linux-x86_64': {
    artifactDirName: 'signatures-linux-x86_64',
    sigPattern: /AppImage\.sig$/i,
    fallbackPattern: /x86_64\.AppImage\.sig$|amd64\.AppImage\.sig$/i,
    urlName: `Ater_${VERSION}_x86_64.AppImage`
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

function readReleaseAssetNames(assetPath) {
  if (!assetPath) return null;
  if (!fs.existsSync(assetPath)) {
    throw new Error(`Release asset manifest not found: ${assetPath}`);
  }
  const data = JSON.parse(fs.readFileSync(assetPath, 'utf-8'));
  const assets = Array.isArray(data) ? data : data.assets;
  if (!Array.isArray(assets)) {
    throw new Error(`Release asset manifest must be an array or contain an assets array: ${assetPath}`);
  }
  return new Set(assets.map(asset => typeof asset === 'string' ? asset : asset.name).filter(Boolean));
}

const artifactsDir = path.join(process.cwd(), 'artifacts');
console.log(`Scanning for signature files in: ${artifactsDir}`);
logDirectory(artifactsDir);

const releaseAssetNames = readReleaseAssetNames(assetsJsonPath);
const missingSignatures = [];
const missingAssets = [];

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
    missingSignatures.push(`${platformKey} (checked ${specificDir} and ${fallbackPattern})`);
    return;
  }

  if (!signature) {
    missingSignatures.push(`${platformKey} (signature file was empty)`);
    return;
  }

  if (releaseAssetNames && !releaseAssetNames.has(urlName)) {
    missingAssets.push(`${platformKey}: ${urlName}`);
    return;
  }

  updateJson.platforms[platformKey] = {
    signature: signature,
    url: `https://github.com/${ORG}/${REPO}/releases/download/v${VERSION}/${urlName}`
  };
});

const expectedKeys = Object.keys(platforms);
const actualKeys = Object.keys(updateJson.platforms);
const missingKeys = expectedKeys.filter(key => !actualKeys.includes(key));

if (missingSignatures.length || missingAssets.length || missingKeys.length) {
  if (missingSignatures.length) {
    console.error('Missing updater signatures:');
    for (const item of missingSignatures) console.error(`  - ${item}`);
  }
  if (missingAssets.length) {
    console.error('Missing release assets for updater URLs:');
    for (const item of missingAssets) console.error(`  - ${item}`);
  }
  if (missingKeys.length) {
    console.error(`Missing updater platform keys: ${missingKeys.join(', ')}`);
  }
  process.exit(1);
}

fs.writeFileSync('update.json', JSON.stringify(updateJson, null, 2));
console.log('✅ Generated update.json:');
console.log(JSON.stringify(updateJson, null, 2));
