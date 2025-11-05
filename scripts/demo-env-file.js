#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function createDemoEnvFiles() {
  // Create demo .env files
  const localEnvContent = `# Local environment variables
SF_TARGET_ORG=local-org@example.com
DEPLOYMENT_PATH=force-app/main/default
CUSTOM_VAR=local-value
`;

  const productionEnvContent = `# Production environment variables
SF_TARGET_ORG=prod-org@example.com
DEPLOYMENT_PATH=force-app/main/default
CUSTOM_VAR=production-value
`;

  await fs.writeFile('.env.local', localEnvContent);
  await fs.writeFile('.env.production', productionEnvContent);

  console.log('Created demo .env files: .env.local and .env.production');
}

async function showDemo() {
  console.log('=== Salesforce CLI Dotenv Plugin Demo ===\n');

  await createDemoEnvFiles();

  console.log('Now you can use the --env-file parameter with any SF CLI command:\n');

  console.log('1. Use a specific .env file:');
  console.log('   sf --env .env.local force:org:list');
  console.log('   sf -e .env.production project deploy start\n');

  console.log('2. Use the default .env file (if it exists):');
  console.log('   sf force:org:list');
  console.log('   sf project deploy start\n');

  console.log('3. Use the manual dotenv command:');
  console.log('   sf dotenv --env .env.local force:org:list');
  console.log('   sf dotenv -e .env.production project deploy start\n');

  console.log('The plugin will automatically:');
  console.log('- Load environment variables from the specified .env file');
  console.log('- Remove the --env-file parameter from the command arguments');
  console.log('- Execute the original command with the loaded environment variables\n');

  console.log('Demo .env files created:');
  console.log('- .env.local (for local development)');
  console.log('- .env.production (for production deployment)');

  console.log('\nTo test this functionality:');
  console.log('1. Install the plugin: npm install -g @salesforce/plugin-dotenv');
  console.log('2. Try: sf --env .env.local force:org:list --help');
  console.log('3. Try: sf -e .env.production project deploy start --help');
}

showDemo().catch(console.error);
