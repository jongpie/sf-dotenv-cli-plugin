import { jest } from '@jest/globals';
import { Config } from '@oclif/core';

import { DEFAULT_ENV_PATH } from '../../../src/shared/index.js';

interface GetEnvResult {
  envFilePath: string;
  env: Record<string, string>;
}

interface ParseResult {
  flags: { env: string; 'show-values': boolean };
}

const mockGetEnv = jest.fn() as jest.Mock<(...args: unknown[]) => Promise<GetEnvResult>>;
const mockDisplayLoadedEnvVars = jest.fn();

jest.mock('@salesforce/sf-plugins-core', () => ({
  SfCommand: class {
    argv: string[] = [];
    constructor(argv: string[]) {
      this.argv = argv;
    }
    parse = jest.fn();
    jsonEnabled = jest.fn().mockReturnValue(false);
    logSensitive = jest.fn();
  },
  Flags: {
    string: (opts?: { default?: string }) => opts?.default ?? DEFAULT_ENV_PATH,
    boolean: (opts?: { default?: boolean }) => opts?.default ?? false,
  },
}));

jest.mock('../../../src/shared/index.js', () => ({
  getEnv: (...args: unknown[]) => mockGetEnv(...args),
  displayLoadedEnvVars: (...args: unknown[]) => mockDisplayLoadedEnvVars(...args),
  PLUGIN_NAME: 'sf-dotenv',
}));

import DotEnvInspect from '../../../src/commands/dotenv/inspect.js';

describe('dotenv inspect command', () => {
  const mockConfig = {} as Config;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnv.mockResolvedValue({
      envFilePath: DEFAULT_ENV_PATH,
      env: { FOO: 'bar', BAZ: 'qux' },
    });
  });

  async function runCommand(argv: string[], flags: { env?: string; 'show-values'?: boolean } = {}): Promise<void> {
    const cmd = new DotEnvInspect(argv, mockConfig);
    const resolvedFlags = {
      env: flags.env ?? DEFAULT_ENV_PATH,
      'show-values': flags['show-values'] ?? false,
    };
    const mockParse = jest.fn() as jest.Mock<() => Promise<ParseResult>>;
    mockParse.mockResolvedValue({ flags: resolvedFlags });
    (cmd as unknown as { parse: typeof mockParse }).parse = mockParse;
    jest.spyOn(cmd, 'jsonEnabled').mockReturnValue(false);
    await cmd.run();
  }

  describe('getEnv integration', () => {
    it('calls getEnv with argv, shouldLog true, and default .env when no --env flag', async () => {
      await runCommand(['dotenv']);

      expect(mockGetEnv).toHaveBeenCalledTimes(1);
      expect(mockGetEnv).toHaveBeenCalledWith(expect.any(Array), true, DEFAULT_ENV_PATH);
    });

    it('calls getEnv with explicit path when --env is provided', async () => {
      const args = ['dotenv', '--env', '.env.staging'];

      await runCommand(['dotenv', '--env', '.env.staging'], {
        env: '.env.staging',
      });

      expect(mockGetEnv).toHaveBeenCalledWith(args, true, '.env.staging');
    });

    it('calls getEnv with explicit path when -e is provided', async () => {
      const args = ['dotenv', '-e', '.env.ci'];

      await runCommand(args, { env: '.env.ci' });

      expect(mockGetEnv).toHaveBeenCalledWith(args, true, '.env.ci');
    });
  });

  describe('displayLoadedEnvVars integration', () => {
    it('calls displayLoadedEnvVars with showValues false when --show-values is not set', async () => {
      await runCommand(['dotenv']);

      expect(mockDisplayLoadedEnvVars).toHaveBeenCalledTimes(1);
      expect(mockDisplayLoadedEnvVars).toHaveBeenCalledWith(
        { envFilePath: DEFAULT_ENV_PATH, env: { FOO: 'bar', BAZ: 'qux' } },
        { showValues: false }
      );
    });

    it('calls displayLoadedEnvVars with showValues true and env when --show-values is set', async () => {
      await runCommand(['dotenv', '--show-values'], {
        'show-values': true,
      });

      expect(mockDisplayLoadedEnvVars).toHaveBeenCalledTimes(1);
      const call = mockDisplayLoadedEnvVars.mock.calls[0];
      expect(call[0]).toEqual({ envFilePath: DEFAULT_ENV_PATH, env: { FOO: 'bar', BAZ: 'qux' } });
      expect(call[1]).toMatchObject({ showValues: true });
    });
  });

  describe('when json is enabled', () => {
    it('does not call displayLoadedEnvVars when jsonEnabled() returns true', async () => {
      const cmd = new DotEnvInspect(['dotenv'], mockConfig);
      const mockParse = jest.fn() as jest.Mock<() => Promise<ParseResult>>;
      mockParse.mockResolvedValue({
        flags: { env: DEFAULT_ENV_PATH, 'show-values': false },
      });
      (cmd as unknown as { parse: typeof mockParse }).parse = mockParse;
      jest.spyOn(cmd, 'jsonEnabled').mockReturnValue(true);
      await cmd.run();

      expect(mockGetEnv).toHaveBeenCalled();
      expect(mockDisplayLoadedEnvVars).not.toHaveBeenCalled();
    });
  });
});
