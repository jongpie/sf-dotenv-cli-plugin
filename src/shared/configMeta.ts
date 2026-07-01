import { ConfigValue } from '@salesforce/core';

import { CONFIG_DEFAULT_ENV_FILE_KEY, CONFIG_SHOULD_LOG_KEY } from './constants.js';

export default [
  {
    key: CONFIG_SHOULD_LOG_KEY,
    description: 'Whether or not to print out the loaded env variables prior to running any other SF CLI command',
    input: {
      validator: (value: ConfigValue): boolean =>
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        value != null && ['true', 'false'].includes(value.toString()),
      failedMessage: 'must provide either "true" or "false"',
    },
  },
  {
    key: CONFIG_DEFAULT_ENV_FILE_KEY,
    description:
      'Default path (relative to the current directory) of the .env file to load when no --env flag or SF_DOTENV_FILE variable is set',
    input: {
      validator: (value: ConfigValue): boolean =>
         
        value != null && typeof value === 'string' && value.trim().length > 0,
      failedMessage: 'must be a non-empty string path to a .env file',
    },
  },
];
