#!/usr/bin/env node

// Check if pnpm is being used
if (process.env.npm_execpath && process.env.npm_execpath.includes('pnpm')) {
  console.log('pnpm detected, installing optional dependencies...');
  
  try {
    const { execSync } = require('child_process');
    execSync('pnpm install --include-optional', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Optional dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install optional dependencies:', error.message);
  }
} else {
  console.log('npm/yarn detected, optional dependencies will not be installed');
} 