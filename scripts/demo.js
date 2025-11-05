#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function demo() {
  console.log('🎯 Salesforce CLI Dotenv Plugin Demo\n');

  // Create a demo .env file
  const demoEnvContent = `# Demo environment variables
SF_TARGET_ORG=demo-org@example.com
DEPLOYMENT_PATH=force-app/main/default
TEST_LEVEL=RunSpecifiedTests
CUSTOM_VAR=demo_value
`;

  const envPath = path.join(process.cwd(), '.env.demo');
  
  try {
    // Write demo .env file
    fs.writeFileSync(envPath, demoEnvContent);
    console.log('📝 Created demo .env file with sample variables');
    console.log('📄 Content:');
    console.log(demoEnvContent);

    console.log('\n🚀 Demo commands you can try:');
    console.log('1. Load and display environment variables:');
    console.log(`   sf dotenv --env-file ${envPath} env`);
    console.log('\n2. Simulate a deployment command:');
    console.log(`   sf dotenv --env-file ${envPath} echo "Deploying from $DEPLOYMENT_PATH"`);
    console.log('\n3. Show org info (if you have SF CLI configured):');
    console.log(`   sf dotenv --env-file ${envPath} force:org:list`);
    console.log('\n4. Test with a custom command:');
    console.log(`   sf dotenv --env-file ${envPath} echo "Target org: $SF_TARGET_ORG"`);

    console.log('\n💡 Tips:');
    console.log('- The plugin will load variables from .env.demo before running commands');
    console.log('- Variables are available as $VARIABLE_NAME in your shell');
    console.log('- Existing environment variables won\'t be overridden');
    console.log('- Use --env-file to specify a different .env file');

    console.log('\n🧹 To clean up:');
    console.log(`   rm ${envPath}`);

  } catch (error) {
    console.error('❌ Demo setup failed:', error.message);
    process.exit(1);
  }
}

demo(); 