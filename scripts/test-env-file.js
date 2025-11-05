#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function createTestEnvFile() {
  const testEnvContent = `# Test environment variables
SF_TARGET_ORG=test-org@example.com
DEPLOYMENT_PATH=force-app/main/default
CUSTOM_VAR=test-value
`;

  await fs.writeFile('.env.test', testEnvContent);
  console.log('Created .env.test file with test variables');
}

async function runTest() {
  console.log('Testing --env-file parameter with existing commands...\n');

  // Create test .env file
  await createTestEnvFile();

  // Test 1: Basic command with --env
  console.log('Test 1: Running sf --env .env.test force:org:list --help');

  const test1 = spawn('sf', ['--env', '.env.test', 'force:org:list', '--help'], {
    stdio: 'pipe',
    env: { ...process.env, SF_DOTENV_DEBUG: 'true' },
  });

  test1.stdout.on('data', (data) => {
    console.log(`Output: ${data}`);
  });

  test1.stderr.on('data', (data) => {
    console.log(`Error: ${data}`);
  });

  test1.on('close', (code) => {
    console.log(`Test 1 completed with code: ${code}\n`);

    // Test 2: Command without --env-file (should use default .env)
    console.log('Test 2: Running sf force:org:list --help (should use default .env)');

    const test2 = spawn('sf', ['force:org:list', '--help'], {
      stdio: 'pipe',
      env: { ...process.env, SF_DOTENV_DEBUG: 'true' },
    });

    test2.stdout.on('data', (data) => {
      console.log(`Output: ${data}`);
    });

    test2.stderr.on('data', (data) => {
      console.log(`Error: ${data}`);
    });

    test2.on('close', (code) => {
      console.log(`Test 2 completed with code: ${code}\n`);

      // Cleanup
      fs.remove('.env.test').then(() => {
        console.log('Cleaned up test files');
      });
    });
  });
}

runTest().catch(console.error);
