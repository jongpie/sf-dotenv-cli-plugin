import { jest } from '@jest/globals';
import { Config } from '@oclif/core';

interface ParseResult {
  flags: { 'output-file': string };
}

const actualPath = jest.requireActual<typeof import('node:path')>('node:path');

const mockAppendFileSync = jest.fn() as jest.Mock;
const mockExistsSync = jest.fn() as jest.Mock<(path: string) => boolean>;
const mockReadFileSync = jest.fn() as jest.Mock;
const mockResolve = jest.fn() as jest.Mock;
const mockStatSync = jest.fn() as jest.Mock;
const mockWriteFileSync = jest.fn() as jest.Mock;

jest.mock('node:fs', () => ({
  appendFileSync: (p: string, data: string) => mockAppendFileSync(p, data),
  existsSync: (p: string) => mockExistsSync(p),
  readFileSync: (p: string, enc?: string) => mockReadFileSync(p, enc),
  statSync: (p: string) => mockStatSync(p),
  writeFileSync: (p: string, data: string) => mockWriteFileSync(p, data),
}));

jest.mock('node:path', () => ({
  resolve: (...args: string[]) => mockResolve(...args),
}));

jest.mock('@salesforce/sf-plugins-core', () => ({
  SfCommand: class {
    argv: string[] = [];
    config: unknown;

    constructor(argv: string[], _config: unknown) {
      this.argv = argv;
      this.config = _config;
    }

    debug = jest.fn();
    error = jest.fn((msg: string) => {
      throw new Error(msg);
    });
    log = jest.fn();
    logSensitive = jest.fn();
    jsonEnabled = jest.fn().mockReturnValue(false);
    parse = jest.fn();
    table = jest.fn();
  },
  Flags: {
    string: (opts?: { default?: string }) => opts?.default ?? '.env',
    boolean: (opts?: { default?: boolean }) => opts?.default ?? true,
  },
}));

import Generate from '../../../src/commands/dotenv/export.js';

describe('dotenv export command', () => {
  const mockConfig = {} as Config;
  const SFDX_PROJECT_FILE = 'sfdx-project.json';

  /** Normalized path for mock checks (Windows uses backslashes). */
  function pathIncludes(pathArg: unknown, suffix: string): boolean {
    const p = String(pathArg).replace(/\\/g, '/');
    return p.includes(suffix) || p.endsWith(suffix);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockResolve.mockImplementation((...args: unknown[]) =>
      actualPath.resolve(...(args as [string, ...string[]]))
    );
    mockStatSync.mockReturnValue({ isDirectory: () => false });
    // Default: no project file (tests that need it override)
    mockExistsSync.mockReturnValue(false);
  });

  async function runCommand(argv: string[], flags: { 'output-file'?: string } = {}): Promise<void> {
    const cmd = new Generate(argv, mockConfig);
    const resolvedFlags: ParseResult['flags'] = {
      'output-file': flags['output-file'] ?? '.env',
    };
    const mockParse = jest.fn() as jest.Mock<() => Promise<ParseResult>>;
    mockParse.mockResolvedValue({ flags: resolvedFlags });
    (cmd as unknown as { parse: typeof mockParse }).parse = mockParse;
    await cmd.run();
  }

  describe('when sfdx-project.json is missing', () => {
    it('errors with a clear message', async () => {
      mockExistsSync.mockReturnValue(false);

      await expect(runCommand(['dotenv', 'export'])).rejects.toThrow(
        /Could not find sfdx-project\.json/
      );

      expect(mockExistsSync).toHaveBeenCalled();
      expect(mockReadFileSync).not.toHaveBeenCalled();
    });
  });

  describe('when sfdx-project.json is invalid JSON', () => {
    it('errors with a parse message', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('not valid json {');

      await expect(runCommand(['dotenv', 'export'])).rejects.toThrow(
        /Failed to parse sfdx-project\.json/
      );
    });
  });

  describe('when there are no replaceWithEnv entries', () => {
    it('returns without writing a file', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ replacements: [] }));

      await runCommand(['dotenv', 'export']);

      expect(mockWriteFileSync).not.toHaveBeenCalled();
      expect(mockAppendFileSync).not.toHaveBeenCalled();
    });

    it('does not log message when jsonEnabled() returns true', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ replacements: [] }));

      const cmd = new Generate(['dotenv', 'export'], mockConfig);
      const mockParse = jest.fn() as jest.Mock<() => Promise<ParseResult>>;
      mockParse.mockResolvedValue({ flags: { 'output-file': '.env' } });
      (cmd as unknown as { parse: typeof mockParse }).parse = mockParse;
      const logSpy = jest.spyOn(cmd, 'log');
      jest.spyOn(cmd, 'jsonEnabled').mockReturnValue(true);

      await cmd.run();

      expect(logSpy).not.toHaveBeenCalledWith(
        'No "replaceWithEnv" entries found in sfdx-project.json. Nothing to do.'
      );
      expect(mockWriteFileSync).not.toHaveBeenCalled();
      expect(mockAppendFileSync).not.toHaveBeenCalled();
    });
  });

  describe('when replaceWithEnv entries exist', () => {
    const projectWithReplacements = {
      replacements: [
        { filename: 'a.json', replaceWithEnv: 'MY_KEY' },
        { replaceWithEnv: 'ANOTHER_VAR' },
        { replaceWithEnv: null }, // null ignored
      ],
    };

    it('writes a new .env with keys and values when file does not exist', async () => {
      mockExistsSync
        .mockReturnValueOnce(true) // project file exists
        .mockReturnValueOnce(false); // output .env does not exist
      mockReadFileSync.mockImplementation((p: unknown) => {
        if (pathIncludes(p, SFDX_PROJECT_FILE)) {
          return JSON.stringify(projectWithReplacements);
        }
        throw new Error('unexpected read');
      });

      const origEnv = process.env.MY_KEY;
      const origAnother = process.env.ANOTHER_VAR;
      process.env.MY_KEY = 'my-value';
      process.env.ANOTHER_VAR = 'another-value';

      try {
        await runCommand(['dotenv', 'export']);
      } finally {
        process.env.MY_KEY = origEnv;
        process.env.ANOTHER_VAR = origAnother;
      }

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      const written = mockWriteFileSync.mock.calls[0][1] as string;
      expect(written).toContain('# Auto-added by sf dotenv export');
      expect(written).toMatch(/ANOTHER_VAR=/);
      expect(written).toMatch(/MY_KEY=/);
      expect(written).toContain('another-value');
      expect(written).toContain('my-value');
    });

    it('appends only missing keys when output file already exists', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync
        .mockImplementationOnce((p: unknown) => {
          if (pathIncludes(p, SFDX_PROJECT_FILE)) {
            return JSON.stringify(projectWithReplacements);
          }
          throw new Error('unexpected read');
        })
        .mockImplementationOnce((p: unknown) => {
          if (pathIncludes(p, '.env')) {
            return 'MY_KEY=already-here\n';
          }
          throw new Error('unexpected read');
        });

      await runCommand(['dotenv', 'export']);

      expect(mockWriteFileSync).not.toHaveBeenCalled();
      expect(mockAppendFileSync).toHaveBeenCalledTimes(1);
      const appended = mockAppendFileSync.mock.calls[0][1] as string;
      expect(appended).toContain('ANOTHER_VAR=');
      expect(appended).not.toContain('MY_KEY=');
    });

    it('does not write when all keys are already in the file', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync
        .mockImplementationOnce((p: unknown) => {
          if (pathIncludes(p, SFDX_PROJECT_FILE)) {
            return JSON.stringify(projectWithReplacements);
          }
          throw new Error('unexpected read');
        })
        .mockImplementationOnce((p: unknown) => {
          if (pathIncludes(p, '.env')) {
            return 'MY_KEY=x\nANOTHER_VAR=y\n';
          }
          throw new Error('unexpected read');
        });

      await runCommand(['dotenv', 'export']);

      expect(mockWriteFileSync).not.toHaveBeenCalled();
      expect(mockAppendFileSync).not.toHaveBeenCalled();
    });
  });

  describe('output-file flag', () => {
    it('uses default .env when not provided', async () => {
      mockExistsSync
        .mockReturnValueOnce(true) // project file exists
        .mockReturnValueOnce(false); // output .env does not exist
      mockReadFileSync.mockImplementation((p: unknown) => {
        if (pathIncludes(p, SFDX_PROJECT_FILE)) {
          return JSON.stringify({ replacements: [{ replaceWithEnv: 'X' }] });
        }
        throw new Error('unexpected read');
      });

      await runCommand(['dotenv', 'export']);

      expect(mockResolve).toHaveBeenCalledWith(expect.any(String), '.env');
    });

    it('uses custom path when --output-file is provided', async () => {
      mockExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
      mockReadFileSync.mockImplementation((p: unknown) => {
        if (pathIncludes(p, SFDX_PROJECT_FILE)) {
          return JSON.stringify({ replacements: [{ replaceWithEnv: 'X' }] });
        }
        throw new Error('unexpected read');
      });

      await runCommand(['dotenv', 'export', '--output-file', '.env.local'], {
        'output-file': '.env.local',
      });

      expect(mockResolve).toHaveBeenCalledWith(expect.any(String), '.env.local');
    });
  });
});
