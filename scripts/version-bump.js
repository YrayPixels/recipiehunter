#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to increment version
function incrementVersion(version) {
  const parts = version.split('.');
  const major = parseInt(parts[0]);
  const minor = parseInt(parts[1]);
  const patch = parseInt(parts[2]);

  // If patch is 9, increment minor and reset patch to 0
  if (patch === 9) {
    return `${major}.${minor + 1}.0`;
  } else {
    return `${major}.${minor}.${patch + 1}`;
  }
}

// Function to read app.config.js
function readAppConfig() {
  const appConfigPath = path.join(__dirname, '..', 'app.config.js');
  return fs.readFileSync(appConfigPath, 'utf8');
}

// Function to extract version from app.config.js
function extractVersion(configContent) {
  const versionMatch = configContent.match(/version:\s*"([^"]+)"/);
  const versionCodeMatch = configContent.match(/versionCode:\s*(\d+)/);
  const runtimeVersionMatch = configContent.match(/runtimeVersion:\s*"([^"]+)"/);

  return {
    version: versionMatch ? versionMatch[1] : null,
    versionCode: versionCodeMatch ? parseInt(versionCodeMatch[1]) : null,
    runtimeVersion: runtimeVersionMatch ? runtimeVersionMatch[1] : null
  };
}

// Function to write app.config.js with updated versions
function writeAppConfig(configContent, newVersion, newVersionCode) {
  const appConfigPath = path.join(__dirname, '..', 'app.config.js');

  // Replace version
  let updatedContent = configContent.replace(
    /version:\s*"[^"]+"/,
    `version: "${newVersion}"`
  );

  // Replace versionCode
  updatedContent = updatedContent.replace(
    /versionCode:\s*\d+/,
    `versionCode: ${newVersionCode}`
  );

  // Replace runtimeVersion
  updatedContent = updatedContent.replace(
    /runtimeVersion:\s*"[^"]+"/,
    `runtimeVersion: "${newVersion}"`
  );

  fs.writeFileSync(appConfigPath, updatedContent, 'utf8');
}

// Function to bump versions
function bumpVersions() {
  console.log('🚀 Starting version bump process...');

  try {
    // Read current app.config.js
    const configContent = readAppConfig();

    // Extract current values
    const currentValues = extractVersion(configContent);
    const originalVersion = currentValues.version;
    const originalVersionCode = currentValues.versionCode;
    const originalRuntimeVersion = currentValues.runtimeVersion;

    if (!originalVersion || originalVersionCode === null || !originalRuntimeVersion) {
      throw new Error('Could not extract version information from app.config.js');
    }

    // Increment version
    const newVersion = incrementVersion(originalVersion);
    const newVersionCode = originalVersionCode + 1;

    console.log(`📦 Current version: ${originalVersion} -> ${newVersion}`);
    console.log(`🔢 Current versionCode: ${originalVersionCode} -> ${newVersionCode}`);
    console.log(`⚡ Current runtimeVersion: ${originalRuntimeVersion} -> ${newVersion}`);

    // Write updated app.config.js
    writeAppConfig(configContent, newVersion, newVersionCode);

    console.log('✅ Version bump completed successfully!');
    console.log(`📝 Updated app.config.js with version ${newVersion} and versionCode ${newVersionCode}`);

    return true;
  } catch (error) {
    console.error('❌ Error during version bump:', error.message);
    return false;
  }
}

// Function to run prebuild
function runPrebuild() {
  console.log('🔨 Running expo prebuild...');
  try {
    execSync('npx expo prebuild', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Prebuild completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error during prebuild:', error.message);
    return false;
  }
}

// Function to run the original build command
function runOriginalBuild() {
  console.log('🏗️  Running original build command...');
  try {
    execSync(
      "eas build --local -p android --profile production --clear-cache",
      {
        stdio: "inherit",
        cwd: path.join(__dirname, ".."),
      }
    );
    console.log('✅ Build completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error during build:', error.message);
    return false;
  }
}

// Main execution
function main() {
  console.log('🎯 HeySolana Version Bump & Build Script');
  console.log('==========================================');

  // Step 1: Bump versions
  if (!bumpVersions()) {
    console.error('❌ Version bump failed. Exiting...');
    process.exit(1);
  }

  // Step 2: Run prebuild
  if (!runPrebuild()) {
    console.error('❌ Prebuild failed. Exiting...');
    process.exit(1);
  }

  // Step 3: Run original build
  if (!runOriginalBuild()) {
    console.error('❌ Build failed. Exiting...');
    process.exit(1);
  }

  console.log('🎉 All processes completed successfully!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  incrementVersion,
  bumpVersions,
  runPrebuild,
  runOriginalBuild
}; 