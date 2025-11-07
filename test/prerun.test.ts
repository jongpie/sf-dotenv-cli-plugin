import { type Command } from '@oclif/core/command';
import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { Config } from '@oclif/core';
import { ux } from '@oclif/core/ux';

import { CONFIG_SHOULD_LOG_KEY } from '../src/shared/constants.js';
import hook from '../src/hooks/prerun.js';

let shouldLogMock = jest.fn();

jest.mock('@salesforce/core', () => ({
  ConfigAggregator: {
    create: () =>
      Promise.resolve({
        getConfig: () => ({ [CONFIG_SHOULD_LOG_KEY]: shouldLogMock() }),
      }),
  },
}));

jest.mock('fs-extra', () => ({
  default: {
    pathExists: jest.fn(),
    readFile: jest.fn(),
  },
}));

jest.mock('path', () => ({
  default: {
    resolve: jest.fn(),
    relative: jest.fn(),
  },
}));

jest.mock('dotenv', () => ({
  default: {
    parse: (val: string) => {
      return (val?.split('\n') ?? [])
        .filter((val) => val)
        .map((splitValue: string) => {
          const keyValue = splitValue.split('=');
          return { [keyValue[0]]: keyValue[1] };
        })
        .reduce((prev, curr) => ({ ...prev, ...curr }), {});
    },
    populate: (env: Record<string, string>, values: Record<string, string>) => {
      for (const [key, val] of Object.entries(values)) {
        env[key] = val;
      }
    },
  },
}));

type FakeReadFileFunction = () => Promise<string>;

const mockedPathExists = fs.pathExists as unknown as jest.Mock<typeof fs.pathExists>;
const mockedReadFile = fs.readFile as unknown as jest.Mock<FakeReadFileFunction>;
const mockedRelative = path.relative as unknown as jest.Mock<typeof path.relative>;
const mockedResolve = path.resolve as unknown as jest.Mock<typeof path.resolve>;

// Create a wrapper function for testing that doesn't require proper this context
const testHook = async (params: { Command: Command.Class; config: Config; argv: string[] }) => {
  const mockContext = {
    config: params.config,
    debug: jest.fn(),
    error: jest.fn(),
    exit: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  };

  return hook.call(mockContext, {
    ...params,
    context: mockContext,
  });
};

describe('prerun hook', () => {
  const originalEnv = { ...process.env };
  const mockConfig = {} as Config;
  const mockCommand = {} as Command.Class;

  beforeEach(() => {
    // Reset environment variables
    Object.keys(process.env).forEach((key) => {
      if (!key.startsWith('JEST_')) {
        delete process.env[key];
      }
    });

    // Reset mocks
    jest.clearAllMocks();

    // Default path.resolve mock
    mockedResolve.mockImplementation((...args: string[]) => args.join('/'));

    // Mock ux console methods
    jest.spyOn(ux, 'stdout').mockImplementation(() => {});
    jest.spyOn(ux, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original environment
    Object.assign(process.env, originalEnv);
  });

  describe('help command handling', () => {
    it('should return early when --help is provided', async () => {
      const argv = ['some-command', '--help'];

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(mockedPathExists).not.toHaveBeenCalled();
      expect(mockedReadFile).not.toHaveBeenCalled();
    });

    it('should return early when -h is provided', async () => {
      const argv = ['some-command', '-h'];

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(mockedPathExists).not.toHaveBeenCalled();
      expect(mockedReadFile).not.toHaveBeenCalled();
    });

    it('should return early when dotenv command is first argument', async () => {
      const argv = ['dotenv', 'some-args'];

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(mockedPathExists).not.toHaveBeenCalled();
      expect(mockedReadFile).not.toHaveBeenCalled();
    });
  });

  describe('environment variable disabling', () => {
    it('should return early when SF_DOTENV_DISABLED is true', async () => {
      process.env.SF_DOTENV_DISABLED = 'true';
      const argv = ['some-command'];

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(mockedPathExists).not.toHaveBeenCalled();
      expect(mockedReadFile).not.toHaveBeenCalled();
    });

    it('should proceed when SF_DOTENV_DISABLED is not true', async () => {
      process.env.SF_DOTENV_DISABLED = 'false';
      const argv = ['some-command'];
      mockedPathExists.mockImplementation(async () => true);
      mockedReadFile.mockImplementation(async () => 'TEST_VAR=test_value');

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(mockedPathExists).toHaveBeenCalled();
    });
  });

  describe('environment file path resolution', () => {
    it('should use --env parameter when provided', async () => {
      const argv = ['some-command', '--env', 'custom.env'];
      mockedPathExists.mockImplementation(async () => true);
      mockedReadFile.mockImplementation(async () => 'TEST_VAR=test_value');

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(mockedResolve).toHaveBeenCalledWith('custom.env');
      expect(mockedPathExists).toHaveBeenCalledWith('custom.env');
    });

    it('should use -e parameter when provided', async () => {
      const argv = ['some-command', '-e', 'custom.env'];
      mockedPathExists.mockImplementation(async () => true);
      mockedReadFile.mockImplementation(async () => 'TEST_VAR=test_value');
      mockedResolve.mockReturnValue('custom.env');

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(mockedResolve).toHaveBeenCalledWith('custom.env');
      expect(mockedPathExists).toHaveBeenCalledWith('custom.env');
    });

    it('should use SF_DOTENV_FILE environment variable when set', async () => {
      process.env.SF_DOTENV_FILE = 'env-file.env';
      const argv = ['some-command'];
      mockedPathExists.mockImplementation(async () => true);
      mockedReadFile.mockImplementation(async () => 'TEST_VAR=test_value');

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(mockedResolve).toHaveBeenCalledWith('env-file.env');
      expect(mockedPathExists).toHaveBeenCalledWith('env-file.env');
    });

    it('should use default .env file when no custom path is provided', async () => {
      const argv = ['some-command'];
      mockedPathExists.mockImplementation(async () => true);
      mockedReadFile.mockImplementation(async () => 'TEST_VAR=test_value');

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(mockedResolve).toHaveBeenCalledWith('.env');
      expect(mockedPathExists).toHaveBeenCalledWith('.env');
    });

    it('should remove --env parameter and its value from argv', async () => {
      const argv = ['some-command', '--env', 'custom.env', 'other-arg'];
      mockedPathExists.mockImplementation(async () => true);
      mockedReadFile.mockImplementation(async () => 'TEST_VAR=test_value');

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(argv).toEqual(['some-command', 'other-arg']);
    });
  });

  describe('file existence handling', () => {
    it('should return early when .env file does not exist', async () => {
      const argv = ['some-command'];
      mockedPathExists.mockImplementation(async () => false);

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(mockedReadFile).not.toHaveBeenCalled();
    });

    it('should warn when custom env file does not exist', async () => {
      shouldLogMock.mockImplementation(() => true);
      const argv = ['some-command', '--env', 'missing.env'];
      mockedPathExists.mockImplementation(async () => false);

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(ux.warn).toHaveBeenCalledWith('Environment file not found: missing.env');
      expect(ux.warn).toHaveBeenCalledWith('Proceeding without loading environment variables...');
    });

    it('should not warn when custom env file does not exist and logging disabled', async () => {
      shouldLogMock.mockImplementation(() => false);
      const argv = ['some-command', '--env', 'missing.env'];
      mockedPathExists.mockImplementation(async () => false);

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(ux.warn).not.toHaveBeenCalledWith('Environment file not found: missing.env');
      expect(ux.warn).not.toHaveBeenCalledWith(
        'Proceeding without loading environment variables...'
      );
    });

    it('should not warn when default .env file does not exist', async () => {
      shouldLogMock.mockImplementation(() => true);

      const argv = ['some-command'];
      mockedPathExists.mockImplementation(async () => false);

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(ux.warn).not.toHaveBeenCalled();
    });
  });

  describe('environment variable loading', () => {
    it('should load environment variables from .env file', async () => {
      const argv = ['some-command'];
      const envContent = 'TEST_VAR=test_value\nANOTHER_VAR=another_value';

      mockedPathExists.mockImplementation(async () => true);
      mockedReadFile.mockResolvedValue(envContent);

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(process.env.TEST_VAR).toBe('test_value');
      expect(process.env.ANOTHER_VAR).toBe('another_value');
    });

    it('should display loading message with correct count and file path', async () => {
      const argv = ['some-command'];
      const envContent = 'TEST_VAR=test_value\nANOTHER_VAR=another_value';

      mockedPathExists.mockImplementation(async () => true);
      mockedReadFile.mockResolvedValue(envContent);
      mockedRelative.mockReturnValue('.env');

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(ux.stdout).toHaveBeenCalledWith(
        expect.stringMatching(/Loading 2 environment variables from \.env:/)
      );
    });

    it('should not display loading message when --json flag is present', async () => {
      const argv = ['some-command', '--json'];
      const envContent = 'TEST_VAR=test_value';

      mockedPathExists.mockImplementation(async () => true);
      mockedReadFile.mockResolvedValue(envContent);

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(ux.stdout).not.toHaveBeenCalled();
    });

    it('should handle empty .env file', async () => {
      const argv = ['some-command'];
      mockedPathExists.mockImplementation(async () => true);
      mockedReadFile.mockResolvedValue('');

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(ux.stdout).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      const argv = ['some-command'];
      const error = new Error('Permission denied');

      mockedPathExists.mockImplementation(async () => true);
      mockedReadFile.mockRejectedValue(error);

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(ux.warn).toHaveBeenCalledWith('Failed to load .env file: Permission denied');
    });

    it('should handle non-Error exceptions', async () => {
      const argv = ['some-command'];

      mockedPathExists.mockImplementation(async () => true);
      mockedReadFile.mockRejectedValue('String error');

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(ux.warn).toHaveBeenCalledWith('Failed to load .env file: Unknown error');
    });
  });

  describe('environment variable precedence', () => {
    it('should override existing environment variables', async () => {
      process.env.EXISTING_VAR = 'existing_value';
      const argv = ['some-command'];
      const envContent = 'EXISTING_VAR=new_value\nNEW_VAR=new_value';

      mockedPathExists.mockImplementation(async () => true);
      mockedReadFile.mockResolvedValue(envContent);

      await testHook({ Command: mockCommand, config: mockConfig, argv });

      expect(process.env.EXISTING_VAR).toBe('new_value');
      expect(process.env.NEW_VAR).toBe('new_value');
    });
  });
});
