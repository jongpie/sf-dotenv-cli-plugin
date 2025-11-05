import { SfCommand } from '@salesforce/sf-plugins-core';
import { getEnv, PLUGIN_NAME } from '../shared/index.js';

export default class DotEnv extends SfCommand<void> {
  public static readonly summary =
    'This plugin runs whenever another `sf` cli command is invoked, and loads environment variables into context.';
  public static readonly description =
    'Runs in the background - prints environment variables if invoked directly';

  public static pluginName = PLUGIN_NAME;

  public async run(): Promise<void> {
    const envConfig = await getEnv(this.argv);
    this.log(
      `sf-dotenv: About to print ${Object.keys(envConfig.env).length} values from ${envConfig.envFilePath}`
    );
    this.logSensitive(`\n\n${JSON.stringify(envConfig.env)}`);
  }
}
