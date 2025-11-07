import { ux } from '@oclif/core/ux';

import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';

function determineEnvFilePath(argv: string[]) {
  // Check for --env or -e parameter in command arguments
  const envFileIndex = argv.findIndex((arg: string) => arg === '--env' || arg === '-e');
  let envFilePath = '.env';

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
  return true;
}

async function loadEnvFile(envFilePath: string): Promise<Record<string, string>> {
  const fileContent = await fs.readFile(envFilePath, 'utf8');
  const parsedContent = dotenv.parse(fileContent);
  dotenv.populate(process.env as Record<string, string>, parsedContent);
  return parsedContent;
}

export const getEnv = async (argv: string[], shouldLog = false) => {
  const { envFilePath, envFileIndex } = determineEnvFilePath(argv);
  if (!(await validateEnvFile(envFilePath, envFileIndex, shouldLog))) {
    return { envFilePath, env: {} };
  }
  const actualFile = await loadEnvFile(envFilePath);
  return { envFilePath: path.relative(process.cwd(), envFilePath), env: actualFile };
};
