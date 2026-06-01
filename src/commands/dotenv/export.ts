import { SfCommand, Flags } from '@salesforce/sf-plugins-core';

import * as fs from 'node:fs';
import * as path from 'node:path';

import { PLUGIN_NAME } from '../../shared/constants.js';

interface SfdxProjectReplacement {
  filename?: string;
  stringToReplace?: string;
  replaceWithEnv?: string;
  [key: string]: unknown;
}

interface SfdxProject {
  replacements?: SfdxProjectReplacement[];
  [key: string]: unknown;
}

const AUTO_ADDED_COMMENT = '# Auto-added by sf dotenv export';
const CHECK = '\x1b[32m✔\x1b[0m ';
const DELIMITER = `\n  ${CHECK}`;
const DEFAULT_OUTPUT_FILE = '.env';
const SFDX_PROJECT_FILE = 'sfdx-project.json';

export default class DotEnvExport extends SfCommand<void> {
  public static pluginName = PLUGIN_NAME;

  public static readonly summary = 'Generate or update an .env file with "replaceWithEnv" entries in sfdx-project.json';
  public static readonly description =
    'Reads sfdx-project.json and writes any "replaceWithEnv" values from the "replacements" node to a .env file. ' +
    'If the output file already exists, only missing keys are appended.';

  public static readonly examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --output-file .env.local',
    '<%= config.bin %> <%= command.id %> --output-file .env.local',
    '<%= config.bin %> <%= command.id %> --output-file .env.test',
  ];

  public static readonly flags = {
    'output-file': Flags.string({
      char: 'o',
      summary: 'Path to the output .env file.',
      description: `Specify the output file path. Defaults to "${DEFAULT_OUTPUT_FILE}" in the current directory.`,
      default: DEFAULT_OUTPUT_FILE,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(DotEnvExport);
    const outputFile = flags['output-file'];

    const projectConfig = this.loadProjectConfig();
    const projectEnvironmentKeys = this.getProjectEnvironmentKeys(projectConfig);
    if (projectEnvironmentKeys === null) {
      return;
    }

    const { outputFilePath, existingContent, existingKeys } = this.readExistingEnvFile(outputFile);

    const missingKeys = this.getMissingKeys(projectEnvironmentKeys, existingKeys, outputFile);
    if (missingKeys === null) {
      return;
    }

    const appendContent = this.buildEnvFileLines(missingKeys, existingContent);
    this.writeEnvFile(outputFilePath, appendContent, existingContent);

    const sortedEnvironmentKeys = [...missingKeys].sort();
    const environmentVariableLabel = `environment variable${missingKeys.length === 1 ? '' : 's'}`;

    const header = `\n ───────── Exporting Environment Variables ────────\n`;
    const loadingLine = `\nExporting ${String(missingKeys.length)} ${environmentVariableLabel} from ${SFDX_PROJECT_FILE} to ${outputFile}:`;
    const printedMessage = DELIMITER + sortedEnvironmentKeys.join(DELIMITER);

    this.log(`${header}${loadingLine}${printedMessage}`);
  }

  private loadProjectConfig(): SfdxProject {
    const projectFilePath = path.resolve(process.cwd(), SFDX_PROJECT_FILE);

    if (!fs.existsSync(projectFilePath)) {
      this.error(`Could not find ${SFDX_PROJECT_FILE} in the current directory (${process.cwd()}).`);
    }

    try {
      const raw = fs.readFileSync(projectFilePath, 'utf-8');
      return JSON.parse(raw) as SfdxProject;
    } catch (err) {
      this.error(`Failed to parse ${SFDX_PROJECT_FILE}: ${(err as Error).message}`);
    }
  }

  private getProjectEnvironmentKeys(project: SfdxProject): string[] | null {
    const projectReplacements = project.replacements ?? [];
    const replacementEnvironmentKeys: string[] = projectReplacements
      .filter(
        (replacement): replacement is SfdxProjectReplacement & { replaceWithEnv: string } =>
          replacement.replaceWithEnv != null
      )
      .map((replacement) => replacement.replaceWithEnv);
    const replacementEnvironmentKeysCount = replacementEnvironmentKeys.length;

    if (replacementEnvironmentKeysCount === 0) {
      if (!this.jsonEnabled()) {
        this.log('No "replaceWithEnv" entries found in sfdx-project.json. Nothing to do.');
      }
      return null;
    }

    const environmentVariableLabel = `environment variable${replacementEnvironmentKeysCount === 1 ? '' : 's'}`;
    const sortedEnvironmentKeys = [...replacementEnvironmentKeys].sort();
    this.log(
      `Found ${String(replacementEnvironmentKeysCount)} ${environmentVariableLabel} in ${SFDX_PROJECT_FILE}:\n\t- ${sortedEnvironmentKeys.join('\n\t- ')}\n\n`
    );
    return replacementEnvironmentKeys;
  }

  private readExistingEnvFile(outputFile: string): {
    outputFilePath: string;
    existingContent: string;
    existingKeys: Set<string>;
  } {
    const outputFilePath = path.resolve(process.cwd(), outputFile);
    let existingContent = '';
    const existingKeys = new Set<string>();

    if (fs.existsSync(outputFilePath)) {
      const stat = fs.statSync(outputFilePath);
      if (stat.isDirectory()) {
        this.error(
          `Output path ${outputFilePath} is a directory, not a file. Use --output-file to specify a file path.`
        );
      }
      existingContent = fs.readFileSync(outputFilePath, 'utf-8');

      for (const line of existingContent.split('\n')) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const equalSignIndex = trimmedLine.indexOf('=');
          if (equalSignIndex !== -1) {
            existingKeys.add(trimmedLine.substring(0, equalSignIndex).trim());
          }
        }
      }

      this.log(`${outputFile} already exists with ${String(existingKeys.size)} key(s) defined.`);
    }

    return { outputFilePath, existingContent, existingKeys };
  }

  private getMissingKeys(environmentKeys: string[], existingKeys: Set<string>, outputFile: string): string[] | null {
    const missingKeys = environmentKeys.filter((k) => !existingKeys.has(k)).sort();

    if (missingKeys.length === 0) {
      if (!this.jsonEnabled()) {
        this.log(
          `\n${CHECK} All environment variables referenced in ${SFDX_PROJECT_FILE} are already present in ${outputFile}. Nothing to add.\n`
        );
      }

      return null;
    }

    return missingKeys;
  }

  private buildEnvFileLines(missingKeys: string[], existingContent: string): string {
    const envFileNewLines: string[] = [];

    if (existingContent && !existingContent.endsWith('\n')) {
      envFileNewLines.push('');
    }

    envFileNewLines.push('');
    envFileNewLines.push(AUTO_ADDED_COMMENT);

    for (const key of missingKeys) {
      envFileNewLines.push(`${key}=${process.env[key] ?? ''}`);
    }

    envFileNewLines.push('');

    return envFileNewLines.join('\n');
  }

  private writeEnvFile(outputFilePath: string, appendContent: string, existingContent: string): void {
    if (existingContent) {
      fs.appendFileSync(outputFilePath, appendContent, 'utf-8');
    } else {
      fs.writeFileSync(outputFilePath, appendContent.trimStart(), 'utf-8');
    }
  }
}
