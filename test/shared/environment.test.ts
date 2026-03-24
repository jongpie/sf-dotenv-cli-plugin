import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';

import { DEFAULT_ENV_PATH, getEnv } from '../../src/shared/index.js';
import { ux } from '@oclif/core/ux';

jest.mock('@oclif/core/ux', () => ({
  ux: {
    warn: jest.fn(),
  },
}));

jest.mock('fs-extra', () => ({
  default: {
    pathExists: jest.fn(),
    readFile: jest.fn(),
    stat: jest.fn<() => Promise<{ isFile: () => boolean }>>().mockResolvedValue({
      isFile: () => true,
    }),
  },
}));

jest.mock('path', () => ({
  default: {
    resolve: jest.fn((...args: string[]) => args.join('/')),
    relative: jest.fn((_cwd: string, p: string) => p),
  },
}));

jest.mock('dotenv', () => ({
  default: {
    parse: (content?: string) => {
      const result: Record<string, string> = {};
      for (const line of (content ?? '').split('\n').filter(Boolean)) {
        const eq = line.indexOf('=');
        if (eq > 0) {
          result[line.slice(0, eq)] = line.slice(eq + 1);
        }
      }
      return result;
    },
    // Mimics dotenv.populate():
    //    - When override is true: it overwrites existing keys
    //    - When override is false: leave existing keys unchanged
    populate: (
      env: Record<string, string>,
      values: Record<string, string>,
      options: { override?: boolean } = { override: false }
    ) => {
      const shouldOverrideExistingValue = Boolean(options.override);
      for (const key of Object.keys(values)) {
        if (Object.prototype.hasOwnProperty.call(env, key) || !shouldOverrideExistingValue) {
          env[key] = values[key];
        }
      }
    },
  },
}));

const mockedPathExists = fs.pathExists as unknown as jest.Mock<() => Promise<boolean>>;
const mockedReadFile = fs.readFile as unknown as jest.Mock<() => Promise<string>>;
const mockedStat = fs.stat as unknown as jest.Mock<() => Promise<{ isFile: () => boolean }>>;
const mockedRelative = path.relative as jest.Mock<(from: string, to: string) => string>;

describe('getEnv (shared/environment)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRelative.mockImplementation((_: string, p: string) => p);
  });

  describe('explicit env file path', () => {
    it('uses explicit path when provided as third argument', async () => {
      mockedPathExists.mockResolvedValue(true);
      mockedReadFile.mockResolvedValue('FOO=bar');

      const result = await getEnv([], false, '.env.staging');

      expect(result.envFilePath).toBe('.env.staging');
      expect(result.env).toEqual({ FOO: 'bar' });
    });

    it('resolves path via path.resolve when explicit path given', async () => {
      mockedPathExists.mockResolvedValue(true);
      mockedReadFile.mockResolvedValue('A=1');
      const pathResolve = path.resolve as jest.Mock;
      pathResolve.mockReturnValueOnce('/resolved/.env.ci');

      await getEnv([], false, '.env.ci');

      expect(pathResolve).toHaveBeenCalledWith('.env.ci');
    });
  });

  describe('argv-based path (--env / -e)', () => {
    it('uses default .env when argv has no --env or -e', async () => {
      mockedPathExists.mockResolvedValue(true);
      mockedReadFile.mockResolvedValue('X=y');

      const result = await getEnv(['some', 'command'], false);

      expect(result.envFilePath).toBe(DEFAULT_ENV_PATH);
      expect(result.env).toEqual({ X: 'y' });
    });

    it('uses path after --env and mutates argv', async () => {
      const argv = ['cmd', '--env', 'custom.env', 'rest'];
      mockedPathExists.mockResolvedValue(true);
      mockedReadFile.mockResolvedValue('K=v');

      const result = await getEnv(argv, false);

      expect(result.envFilePath).toBe('custom.env');
      expect(argv).toEqual(['cmd', 'rest']);
    });

    it('uses path after -e', async () => {
      const argv = ['cmd', '-e', 'short.env'];
      mockedPathExists.mockResolvedValue(true);
      mockedReadFile.mockResolvedValue('A=b');

      const result = await getEnv(argv, false);

      expect(result.envFilePath).toBe('short.env');
      expect(result.env).toEqual({ A: 'b' });
    });
  });

  describe('SF_DOTENV_FILE', () => {
    const ORIGINAL_ENV = process.env;

    afterEach(() => {
      process.env = ORIGINAL_ENV;
    });

    it('uses SF_DOTENV_FILE when set and no --env in argv', async () => {
      process.env = { ...ORIGINAL_ENV, SF_DOTENV_FILE: 'env-file.env' };
      mockedPathExists.mockResolvedValue(true);
      mockedReadFile.mockResolvedValue('E=1');

      const result = await getEnv(['cmd'], false);

      expect(result.envFilePath).toBe('env-file.env');
      expect(result.env).toEqual({ E: '1' });
    });
  });

  describe('file existence', () => {
    it('returns empty env and path when file does not exist (explicit path)', async () => {
      mockedPathExists.mockResolvedValue(false);

      const result = await getEnv([], false, 'missing.env');

      expect(result.env).toEqual({});
      expect(result.envFilePath).toBe('missing.env');
      expect(mockedReadFile).not.toHaveBeenCalled();
    });

    it('returns empty env when file does not exist (default .env)', async () => {
      mockedPathExists.mockResolvedValue(false);

      const result = await getEnv(['cmd'], false);

      expect(result.env).toEqual({});
      expect(mockedReadFile).not.toHaveBeenCalled();
    });
  });

  describe('path is a directory', () => {
    it('returns empty env when path is a directory (not a file)', async () => {
      mockedPathExists.mockResolvedValue(true);
      mockedStat.mockResolvedValueOnce({ isFile: () => false });
      const shouldLog = false;

      const result = await getEnv([], shouldLog, 'some-dir');

      expect(result.env).toEqual({});
      expect(result.envFilePath).toBe('some-dir');
      expect(mockedReadFile).not.toHaveBeenCalled();
    });

    it('warns when path is a directory and shouldLog is true', async () => {
      mockedPathExists.mockResolvedValue(true);
      mockedStat.mockResolvedValueOnce({ isFile: () => false });
      const shouldLog = true;

      await getEnv([], shouldLog, '/path/to/dir');

      expect(ux.warn).toHaveBeenCalledWith(
        '/path/to/dir is a directory, not a file. Proceeding without loading environment variables.'
      );
    });
  });

  describe('successful load', () => {
    it('returns parsed env and relative path', async () => {
      mockedPathExists.mockResolvedValue(true);
      mockedReadFile.mockResolvedValue('ALPHA=one\nBETA=two');
      mockedRelative.mockReturnValue(DEFAULT_ENV_PATH);

      const result = await getEnv([], false, 'some/.env');

      expect(result.env).toEqual({ ALPHA: 'one', BETA: 'two' });
      expect(result.envFilePath).toBe(DEFAULT_ENV_PATH);
    });
  });
});
