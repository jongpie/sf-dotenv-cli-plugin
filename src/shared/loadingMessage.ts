import { ux } from '@oclif/core';

import type { EnvConfig } from './environment.js';

const CHECK = '\x1b[32m✔\x1b[0m ';
const DELIMITER = `\n  ${CHECK}`;

/** Message shown before printing env values; ux.warn() adds the "Warning:" prefix. */
export const SENSITIVE_OUTPUT_WARNING =
  'The following output contains sensitive information (environment variable values).';

interface DisplayLoadedEnvVarsOptions {
  showValues: boolean;
}

/**
 * Display the "Loading Environment Variables" block.
 * When showValues is false: variable names only with checkmarks (prerun and `sf dotenv` without --show-values).
 * When showValues is true: key=value pairs with checkmarks, preceded by a security warning (all via ux).
 */
export function displayLoadedEnvVars(
  envConfig: EnvConfig,
  options: DisplayLoadedEnvVarsOptions
): void {
  const loadedVars = Object.keys(envConfig.env);
  const loadedCount = loadedVars.length;
  if (loadedCount === 0) {
    return;
  }

  const sortedEnvironmentKeys = [...loadedVars].sort();
  const environmentVariableLabel = `environment variable${loadedCount === 1 ? '' : 's'}`;

  const header = `\n ────────── Loading Environment Variables ─────────\n`;
  const loadingLine = `Loading ${String(loadedCount)} ${environmentVariableLabel} from file ${envConfig.envFilePath}:`;
  let printedMessage = sortedEnvironmentKeys.join(DELIMITER);

  if (options.showValues) {
    ux.warn(SENSITIVE_OUTPUT_WARNING);
    printedMessage = sortedEnvironmentKeys
      .map((key) => `${key}=${envConfig.env[key]}`)
      .join(DELIMITER);
  }
  ux.stdout(`${header}${loadingLine}${DELIMITER}${printedMessage}`);
}
