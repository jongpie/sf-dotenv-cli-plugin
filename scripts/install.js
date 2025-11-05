#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function install() {
  console.log('🚀 Setting up Salesforce CLI Dotenv Plugin...\n');

  try {
    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      console.error('❌ package.json not found. Please run this script from the project root.');
      process.exit(1);
    }

    // Install dependencies
    console.log('📦 Installing dependencies...');
    const { execSync } = require('child_process');
    execSync('npm install', { stdio: 'inherit' });

    // Build the project
    console.log('🔨 Building the project...');
    execSync('npm run compile', { stdio: 'inherit' });

    // Create example .env file if it doesn't exist
    const envExamplePath = path.join(process.cwd(), 'env.example');
    const envPath = path.join(process.cwd(), '.env');
    
    if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
      console.log('📝 Creating example .env file...');
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ Created .env file from env.example');
      console.log('📝 Please edit .env file with your actual values');
    }

    // Link the plugin locally
    console.log('🔗 Linking plugin locally...');
    execSync('npm link', { stdio: 'inherit' });

    console.log('\n✅ Installation complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Edit the .env file with your environment variables');
    console.log('2. Test the plugin: sf dotenv --help');
    console.log('3. Try a command: sf dotenv force:org:list');
    console.log('\n📚 For more information, see README.md');

  } catch (error) {
    console.error('❌ Installation failed:', error.message);
    process.exit(1);
  }
}

install(); 