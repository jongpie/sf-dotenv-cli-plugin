import { type Hook } from '@oclif/core/hooks';
import { ux } from '@oclif/core';
import { ConfigAggregator } from '@salesforce/core';

import { CONFIG_SHOULD_LOG_KEY, getEnv, PLUGIN_NAME } from '../shared/index.js';

let shouldLog = false;

/**
 * Check if the hook should be skipped based on command arguments
 */
function shouldSkipHook(argv: string[], pluginName?: string) {
  return (
    pluginName === PLUGIN_NAME ||
    argv.includes('--help') ||
    argv.includes('-h') ||
    argv[0] === 'dotenv'
  );
}

/**
 * Check if dotenv loading is disabled via environment variable
 */
function isDotEnvDisabled() {
  return process.env.SF_DOTENV_DISABLED === 'true';
}

function getLoadedVariables(envConfig: Record<string, string>): {
  loadedCount: number;
  loadedVars: string[];
} {
  const loadedVars = Object.keys(envConfig);
  const loadedCount = loadedVars.length;

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
  if (!shouldLog) {
    return;
  }

  if (loadedCount > 0 && !argv.includes('--json')) {
    loadedVars.sort();

    const delimiter = '\n  \x1b[32m✔\x1b[0m ';

    ux.stdout(`\n───────── Loading Environment Variables ──────────\n`);

    ux.stdout(
      `Loading ${loadedCount} environment variables from ${envFilePath}:${delimiter}${loadedVars.join(
        delimiter
      )}`
    );

    ux.stdout(`\n───────── End Environment Variables ──────────\n`);
  }
}

/**
 * Handle errors during environment file loading
 */
function handleLoadError(error: unknown): void {
  if (shouldLog) {
    ux.warn(
      `Failed to load .env file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Main prerun hook function
 */
const hook: Hook.Prerun = async function ({ Command, argv }) {
  const configAggregator = await ConfigAggregator.create();
  const configValue = configAggregator.getConfig()[CONFIG_SHOULD_LOG_KEY];
  shouldLog = Boolean(configValue);

  if (shouldSkipHook(argv, Command.pluginName) || isDotEnvDisabled()) {
    return;
  }

  try {
    const envConfig = await getEnv(argv, shouldLog);

    const { loadedCount, loadedVars } = getLoadedVariables(envConfig.env);

    displayLoadingMessage(loadedCount, loadedVars, envConfig.envFilePath, argv);
  } catch (error) {
    handleLoadError(error);
  }
};

export default hook;
