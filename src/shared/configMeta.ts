import { ConfigValue } from '@salesforce/core';

import { CONFIG_SHOULD_LOG_KEY } from './constants.js';

export default [
  {
    key: CONFIG_SHOULD_LOG_KEY,
    description:
      'Whether or not to print out the loaded env variables prior to running any other SF CLI command',
    input: {
      validator: (value: ConfigValue): boolean =>
        value != null && ['true', 'false'].includes(value.toString()),
      failedMessage: 'Must provide a boolean value.',
    },
  },
];
