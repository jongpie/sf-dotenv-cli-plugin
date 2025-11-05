# Quick Start Guide

Get up and running with the Salesforce CLI Dotenv Plugin in minutes!

## Prerequisites

- Node.js 18.0.0 or higher
- Salesforce CLI installed globally
- npm or yarn

## Installation

### Option 1: Development Installation (Recommended for contributors)

```bash
# Clone the repository
git clone https://github.com/yourusername/sf-dotenv-cli-plugin.git
cd sf-dotenv-cli-plugin

# Run the automated setup
npm run install:dev
```

### Option 2: Manual Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sf-dotenv-cli-plugin.git
cd sf-dotenv-cli-plugin

# Install dependencies
npm install

# Build the project
npm run compile

# Link the plugin locally
npm link
```

## Quick Test

1. **Create a test .env file:**

   ```bash
   cp env.example .env
   ```

2. **Edit the .env file with your values:**

   ```env
   SF_TARGET_ORG=your-org@example.com
   DEPLOYMENT_PATH=force-app/main/default
   ```

3. **Test the plugin:**

   ```bash
   # Show help
   sf dotenv --help

   # Test with a simple command
   sf dotenv echo "Hello from dotenv plugin!"

   # Test with SF CLI command (if you have orgs configured)
   sf dotenv force:org:list
   ```

## Demo Mode

Run the demo to see the plugin in action:

```bash
npm run demo
```

This will create a demo `.env.demo` file and show you example commands to try.

## Usage Examples

### Basic Usage

```bash
# Execute any SF CLI command with .env support
sf dotenv force:org:list
sf dotenv force:org:display --target-org my-org
sf dotenv force:source:deploy --source-dir force-app/main/default
```

### Custom .env File

```bash
# Use a specific .env file
sf dotenv --env-file .env.local force:org:list
sf dotenv --env-file config/production.env force:source:deploy
```

### Environment Variables

Create a `.env` file in your project:

```env
# Salesforce Configuration
SF_TARGET_ORG=my-org@example.com
SF_INSTANCE_URL=https://login.salesforce.com

# Deployment Configuration
DEPLOYMENT_PATH=force-app/main/default
TEST_LEVEL=RunSpecifiedTests

# Custom Variables
PROJECT_NAME=my-salesforce-project
```

Then use them in commands:

```bash
# Variables are automatically loaded and available
sf dotenv force:source:deploy --source-dir $DEPLOYMENT_PATH
sf dotenv force:org:display --target-org $SF_TARGET_ORG
```

## Troubleshooting

### Plugin not found

```bash
# Make sure the plugin is linked
npm link

# Check if it's available
sf plugins
```

### Build errors

```bash
# Clean and rebuild
npm run clean
npm run compile
```

### Test the plugin

```bash
# Run tests
npm test

# Run demo
npm run demo
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check out [CONTRIBUTING.md](CONTRIBUTING.md) if you want to contribute
- Create issues or pull requests on GitHub

## Support

- Create an issue on GitHub for bugs or feature requests
- Check the [README.md](README.md) for detailed documentation
- Try the demo mode: `npm run demo`

Happy coding! 🚀
