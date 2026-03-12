import { ux } from '@oclif/core/ux';

import dotenvLib from 'dotenv';
import fs from 'fs-extra';
import path from 'path';

import { DEFAULT_ENV_PATH } from '../shared/index.js';

function determineEnvFilePath(argv: string[], explicitPath?: string) {
  if (explicitPath !== undefined) {
    return { envFilePath: path.resolve(explicitPath), envFileIndex: -1 };
  }

  // Check for --env or -e parameter in command arguments
  const envFileIndex = argv.findIndex((arg: string) => arg === '--env' || arg === '-e');
  let envFilePath = DEFAULT_ENV_PATH;

  if (envFileIndex !== -1 && envFileIndex + 1 < argv.length) {
    envFilePath = argv[envFileIndex + 1];
    // Remove the --env/-e and its value from argv to prevent command parsing issues
    argv.splice(envFileIndex, 2);
  } else if (process.env.SF_DOTENV_FILE) {
    envFilePath = process.env.SF_DOTENV_FILE;
  }

  return { envFilePath: path.resolve(envFilePath), envFileIndex };
}

async function validateEnvFile(
  envFilePath: string,
  envFileIndex: number,
  shouldLog: boolean
): Promise<boolean> {
  if (!(await fs.pathExists(envFilePath))) {
    if (envFileIndex !== -1 && shouldLog) {
      ux.warn(`Environment file not found: ${envFilePath}`);
      ux.warn('Proceeding without loading environment variables...');
    }
    return false;
  }
  const stat = await fs.stat(envFilePath);
  if (!stat.isFile()) {
    if (shouldLog) {
      ux.warn(
        `${envFilePath} is a directory, not a file. Proceeding without loading environment variables.`
      );
    }
    return false;
  }
  return true;
}

async function loadEnvFile(envFilePath: string): Promise<Record<string, string>> {
  const fileContent = await fs.readFile(envFilePath, 'utf8');
  const parsedContent = dotenvLib.parse(fileContent);
  dotenvLib.populate(process.env as Record<string, string>, parsedContent, { override: true });
  return parsedContent;
}

/** Result of loading an env file: path (relative to cwd) and parsed key-value map. */
export interface EnvConfig {
  envFilePath: string;
  env: Record<string, string>;
}

export const getEnv = async (
  argv: string[],
  shouldLog = false,
  explicitEnvFilePath?: string
): Promise<EnvConfig> => {
  const { envFilePath, envFileIndex } = determineEnvFilePath(argv, explicitEnvFilePath);
  if (!(await validateEnvFile(envFilePath, envFileIndex, shouldLog))) {
    return { envFilePath: path.relative(process.cwd(), envFilePath), env: {} };
  }

  const actualFile = await loadEnvFile(envFilePath);
  return { envFilePath: path.relative(process.cwd(), envFilePath), env: actualFile };
};
