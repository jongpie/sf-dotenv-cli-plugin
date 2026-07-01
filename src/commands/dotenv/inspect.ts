import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import {
  DEFAULT_ENV_PATH,
  displayLoadedEnvVars,
  getEnv,
  PLUGIN_NAME,
  resolveConfiguredDefaultEnvFile,
} from '../../shared/index.js';

export default class DotEnvInspect extends SfCommand<void> {
  public static readonly summary =
    'This plugin runs whenever another `sf` cli command is invoked, and loads environment variables into context.';
  public static readonly description = 'Runs in the background - prints environment variables if invoked directly';

  public static pluginName = PLUGIN_NAME;

  public static readonly flags = {
    env: Flags.string({
      char: 'e',
      summary: 'Path to the .env file to load.',
      description: `Defaults to the "default-env-file" \`sf config\` value, then the SF_DOTENV_FILE environment variable, and finally "${DEFAULT_ENV_PATH}".`,
    }),
    'show-values': Flags.boolean({
      summary: 'Print the loaded environment variable names and values.',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(DotEnvInspect);
    const configuredDefault = flags.env ? undefined : await resolveConfiguredDefaultEnvFile();
    const envConfig = await getEnv(this.argv, true, flags.env, configuredDefault);

    if (!this.jsonEnabled()) {
      displayLoadedEnvVars(envConfig, { showValues: flags['show-values'] });
    }
  }
}
