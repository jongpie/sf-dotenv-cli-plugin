import { type Hook } from '@oclif/core/hooks';
import { ux } from '@oclif/core';
import { ConfigAggregator } from '@salesforce/core';

import {
  CONFIG_SHOULD_LOG_KEY,
  configMeta as customConfigMeta,
  displayLoadedEnvVars,
  getEnv,
  PLUGIN_NAME,
} from '../shared/index.js';

let shouldLog = true;

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

/**
 * Display the loading message with environment variables (when not suppressed)
 */
function displayLoadingMessage(
  envConfig: { envFilePath: string; env: Record<string, string> },
  argv: string[]
): void {
  if (!shouldLog || argv.includes('--json')) {
    return;
  }
  displayLoadedEnvVars(envConfig);
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
  const configAggregator = await ConfigAggregator.create({ customConfigMeta });
  const configValue = configAggregator.getPropertyValue(CONFIG_SHOULD_LOG_KEY);
  if (configValue !== undefined) {
    shouldLog = Boolean(configValue);
  }

  if (shouldSkipHook(argv, Command.pluginName) || isDotEnvDisabled()) {
    return;
  }

  try {
    const envConfig = await getEnv(argv, shouldLog);
    displayLoadingMessage(envConfig, argv);
  } catch (error) {
    handleLoadError(error);
  }
};

export default hook;
