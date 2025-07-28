#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Clean build artifacts and temporary files
 */
function cleanDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`Cleaning ${dirPath}...`);
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

function cleanBuildArtifacts() {
  console.log("🧹 Cleaning build artifacts...\n");

  // Backend build artifacts
  cleanDirectory("backend/dist");

  // Frontend build artifacts
  cleanDirectory("frontend/.next");
  cleanDirectory("frontend/.swc");
  cleanDirectory("frontend/out");

  // General build artifacts
  cleanDirectory("dist");
  cleanDirectory("build");
  cleanDirectory("out");

  // Test coverage
  cleanDirectory("coverage");
  cleanDirectory("frontend/coverage");
  cleanDirectory("backend/coverage");

  // Temporary files
  cleanDirectory(".tmp");
  cleanDirectory(".temp");

  console.log("✅ Build artifacts cleaned successfully!");
}

if (require.main === module) {
  cleanBuildArtifacts();
}

module.exports = { cleanBuildArtifacts };
