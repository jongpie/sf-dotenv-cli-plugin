# Salesforce CLI Dotenv Plugin

A Salesforce CLI plugin that enables loading environment variables from `.env` files when executing SF CLI commands. This plugin solves the problem of having to globally configure project-specific environment variables on your machine.

## Logging Out Loaded Environment Variables

If you want to see which environment variables the plugin is passing to other `sf` CLI commands, you can always run the following snippet:

```bash
$ sf config set should-log-env true
```

To disable logging, you can run either of the following:

```bash
$ sf config set should-log-env false
# OR
$ sf config unset should-log-env
```

## Features

- **Automatic Loading**: Automatically loads environment variables from `.env` files before any SF CLI command runs (via prerun hook)
- **--env Parameter**: Add `--env` or `-e` to any SF CLI command to load environment variables from a specific file
- **Manual Command**: Execute SF CLI commands with `.env` file support using the `sf dotenv` command
- **Custom .env File Paths**: Support for custom `.env` file paths via command flags or environment variables
- **Environment Variable Priority**: Preserve existing environment variables (won't override if already set)
- **Seamless Integration**: Works with all SF CLI commands and flags
- **Debug Support**: Enable debug mode to see detailed loading information

## Installation

### Global Installation

```bash
npm install -g @salesforce/plugin-dotenv
```

### Local Development Installation

```bash
git clone https://github.com/yourusername/sf-dotenv-cli-plugin.git
cd sf-dotenv-cli-plugin
npm install
npm run compile
npm link
```

## Usage

### Automatic Loading (Recommended)

The plugin automatically loads environment variables from `.env` files before any SF CLI command runs. Simply create a `.env` file in your project root and run any SF CLI command:

```bash
# Create .env file with your variables
echo "SF_TARGET_ORG=my-org@example.com" > .env
echo "DEPLOYMENT_PATH=force-app/main/default" >> .env

# Run any SF CLI command - variables are loaded automatically
sf force:org:list
sf force:source:deploy --source-dir $DEPLOYMENT_PATH
```

### Manual Command Usage

You can also use the `sf dotenv` command to explicitly load environment variables:

```bash
# Execute any SF CLI command with .env file support
sf dotenv force:org:list
sf dotenv force:org:display --target-org my-org
sf dotenv force:source:deploy --source-dir force-app/main/default
```

### Custom .env File

#### Using the Manual Command

```bash
# Use a specific .env file
sf dotenv --env .env.local force:org:list
sf dotenv -e .env.production project deploy start
sf dotenv --env config/production.env force:source:deploy
```

#### Using --env Parameter with Any Command (New!)

You can now add `--env` or `-e` to any SF CLI command to load environment variables from a specific file:

```bash
# Use --env with any command
sf --env .env.local force:org:list
sf --env .env.production project deploy start
sf -e config/staging.env force:source:deploy --source-dir force-app/main/default
```

#### Using Environment Variables (for Automatic Loading)

```bash
# Set custom .env file path
export SF_DOTENV_FILE=.env.local
sf force:org:list

# Or set it for a single command
SF_DOTENV_FILE=.env.production sf force:source:deploy
```

### Environment Variables in .env File

Create a `.env` file in your project root:

```env
# Salesforce Org Configuration
SF_TARGET_ORG=my-org@example.com
SF_INSTANCE_URL=https://login.salesforce.com

# API Configuration
SF_CLIENT_ID=your_client_id
SF_CLIENT_SECRET=your_client_secret

# Custom Variables
DEPLOYMENT_PATH=force-app/main/default
TEST_LEVEL=RunSpecifiedTests
```

## Examples

### Deploy with Environment Variables

```bash
# .env file contains: DEPLOYMENT_PATH=force-app/main/default
sf dotenv force:source:deploy --source-dir $DEPLOYMENT_PATH
# Or use the new --env parameter
sf --env .env.production project deploy start
```

### Run Tests with Custom Configuration

```bash
# .env file contains: TEST_LEVEL=RunSpecifiedTests
sf dotenv force:apex:test:run --test-level $TEST_LEVEL
# Or use the shorthand
sf -e .env.test force:apex:test:run --test-level $TEST_LEVEL
```

### Connect to Different Orgs

```bash
# .env file contains: SF_TARGET_ORG=dev-org@example.com
sf dotenv force:org:display --target-org $SF_TARGET_ORG
# Or use the new --env parameter
sf --env .env.dev force:org:display --target-org $SF_TARGET_ORG
```

## How It Works

1. The plugin reads the specified `.env` file (defaults to `.env` in the current directory)
2. It loads all environment variables from the file into the current process
3. It preserves any existing environment variables (won't override if already set)
4. It executes the specified SF CLI command with the loaded environment variables
5. The command runs exactly as if you had set the environment variables manually

## Configuration

### Environment Variables

The plugin supports several environment variables for configuration:

- `SF_DOTENV_FILE`: Path to the `.env` file to load (defaults to `.env` in current directory)
- `SF_DOTENV_DISABLED`: Set to `true` to disable automatic loading
- `SF_DOTENV_DEBUG`: Set to `true` to enable debug mode and see detailed loading information

### Examples

```bash
# Use a custom .env file
export SF_DOTENV_FILE=.env.production
sf force:org:list

# Disable automatic loading
export SF_DOTENV_DISABLED=true
sf force:org:list

# Enable debug mode
export SF_DOTENV_DEBUG=true
sf force:org:list
```

## Environment Variable Priority

The plugin follows this priority order for environment variables:

1. Already set environment variables (highest priority)
2. Variables from the `.env` file
3. System default environment variables (lowest priority)

This means that if an environment variable is already set in your shell, it won't be overridden by the `.env` file.

## Development

### Building the Plugin

```bash
npm run compile
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Formatting

```bash
npm run format
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

Apache-2.0

## Support

- [GitHub Issues](https://github.com/yourusername/sf-dotenv-cli-plugin/issues)
- [Documentation](https://github.com/yourusername/sf-dotenv-cli-plugin#readme)

## Related

- [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli)
- [dotenv package](https://www.npmjs.com/package/dotenv)
