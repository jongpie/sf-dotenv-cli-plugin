import * as dotenv from 'dotenv';
import * as fs from 'fs-extra';
import * as path from 'path';
import { type Hook } from '@oclif/core/hooks';

/**
 * Check if the hook should be skipped based on command arguments
 */
function shouldSkipHook(argv: string[]): boolean {
  return argv.includes('--help') || argv.includes('-h') || argv[0] === 'dotenv';
}

/**
 * Check if dotenv loading is disabled via environment variable
 */
function isDotEnvDisabled(): boolean {
  return process.env.SF_DOTENV_DISABLED === 'true';
}

/**
 * Determine the environment file path based on command arguments and environment variables
 */
function determineEnvFilePath(argv: string[]): { envFilePath: string; envFileIndex: number } {
  // Check for --env or -e parameter in command arguments
  const envFileIndex = argv.findIndex((arg: string) => arg === '--env' || arg === '-e');

  if (envFileIndex !== -1 && envFileIndex + 1 < argv.length) {
    // Remove the --env/-e and its value from argv to prevent command parsing issues
    const envFileValue = argv[envFileIndex + 1];
    argv.splice(envFileIndex, 2);
    return { envFilePath: path.resolve(envFileValue), envFileIndex };
  } else if (process.env.SF_DOTENV_FILE) {
    // Check for custom .env file path from environment variable
    return { envFilePath: path.resolve(process.env.SF_DOTENV_FILE), envFileIndex: -1 };
  } else {
    // Look for .env file in current directory
    return { envFilePath: path.resolve('.env'), envFileIndex: -1 };
  }
}

/**
 * Check if the environment file exists and handle missing file scenarios
 */
async function validateEnvFile(envFilePath: string, envFileIndex: number): Promise<boolean> {
  if (!(await fs.pathExists(envFilePath))) {
    if (envFileIndex !== -1) {
      console.warn(`Environment file not found: ${envFilePath}`);
      console.warn('Proceeding without loading environment variables...');
    }
    return false;
  }
  return true;
}

/**
 * Load and parse environment variables from the .env file
 */
async function loadEnvFile(envFilePath: string): Promise<Record<string, string>> {
  const fileContent = await fs.readFile(envFilePath, 'utf8');
  return dotenv.parse(fileContent);
}

/**
 * Set environment variables in process.env
 */
function setEnvironmentVariables(envConfig: Record<string, string>): {
  loadedCount: number;
  loadedVars: string[];
} {
  let loadedCount = 0;
  const loadedVars: string[] = [];

  for (const [key, value] of Object.entries(envConfig)) {
    process.env[key] = value;
    loadedCount++;
    loadedVars.push(key);
  }

  return { loadedCount, loadedVars };
}

/**
 * Display the loading message with environment variables
 */
function displayLoadingMessage(
  loadedCount: number,
  loadedVars: string[],
  envFilePath: string,
  argv: string[]
): void {
  if (loadedCount > 0 && !argv.includes('--json')) {
    loadedVars.sort();

    const delimiter = '\n  \x1b[32m✔\x1b[0m ';

    console.log(`\n\n───────── Loading Environment Variables ──────────\n\n`);

    console.log(
      `Loading ${loadedCount} environment variables from ${path.relative(process.cwd(), envFilePath)}:${delimiter}${loadedVars.join(
        delimiter
      )}`
    );
  }
}

/**
 * Handle errors during environment file loading
 */
function handleLoadError(error: unknown): void {
  console.warn(
    `Failed to load .env file: ${error instanceof Error ? error.message : 'Unknown error'}`
  );
}

/**
 * Main prerun hook function
 */
const hook: Hook.Prerun = async function ({ argv }) {
  // Skip if this is a help command or if we're already in the dotenv command
  if (shouldSkipHook(argv)) {
    return;
  }

  // Check if dotenv loading is disabled
  if (isDotEnvDisabled()) {
    return;
  }

  // Determine which .env file to load
  const { envFilePath, envFileIndex } = determineEnvFilePath(argv);

  // Check if .env file exists
  if (!(await validateEnvFile(envFilePath, envFileIndex))) {
    return;
  }

  try {
    // Load environment variables from .env file
    const envConfig = await loadEnvFile(envFilePath);

    // Set environment variables
    const { loadedCount, loadedVars } = setEnvironmentVariables(envConfig);

    // Display loading message
    displayLoadingMessage(loadedCount, loadedVars, envFilePath, argv);
  } catch (error) {
    handleLoadError(error);
  }
};

export default hook;
