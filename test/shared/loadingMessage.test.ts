import { jest } from '@jest/globals';
import { ux } from '@oclif/core';

import { displayLoadedEnvVars, SENSITIVE_OUTPUT_WARNING } from '../../src/shared/loadingMessage.js';

jest.mock('@oclif/core', () => ({
  ux: {
    stdout: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('displayLoadedEnvVars (shared/loadingMessage)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when envConfig.env is empty', () => {
    it('does not call ux.stdout or ux.warn', () => {
      displayLoadedEnvVars({ envFilePath: '.env', env: {} });
      displayLoadedEnvVars({ envFilePath: '.env', env: {} }, { showValues: true });

      expect(ux.stdout).not.toHaveBeenCalled();
      expect(ux.warn).not.toHaveBeenCalled();
    });
  });

  describe('names only (showValues false or omitted)', () => {
    it('calls ux.stdout with header and loading line and variable names with checkmarks', () => {
      displayLoadedEnvVars({ envFilePath: '.env', env: { FOO: 'x', BAR: 'y' } });

      expect(ux.stdout).toHaveBeenCalledTimes(1);
      const output = (ux.stdout as jest.Mock).mock.calls[0][0];
      expect(output).toContain('Loading Environment Variables');
      expect(output).toMatch(/Loading 2 environment variables from file \.env:/);
      expect(output).toContain('FOO');
      expect(output).toContain('BAR');
      expect(output).toContain('✔');
    });

    it('sorts variable names', () => {
      displayLoadedEnvVars({ envFilePath: '.env', env: { ZEE: 'z', ALPHA: 'a' } });

      const output = (ux.stdout as jest.Mock).mock.calls[0][0] as string;
      const checkIndex = output.indexOf('✔');
      const afterCheck = output.slice(checkIndex);
      expect(afterCheck.indexOf('ALPHA')).toBeLessThan(afterCheck.indexOf('ZEE'));
    });

    it('uses singular "environment variable" when count is 1', () => {
      displayLoadedEnvVars({ envFilePath: '.env', env: { ONLY: 'v' } });

      expect(ux.stdout).toHaveBeenCalledWith(
        expect.stringMatching(/Loading 1 environment variable from file \.env:/)
      );
    });
  });

  describe('showValues true', () => {
    it('calls ux.warn then ux.stdout with header, loading line, and key=value lines with checkmarks', () => {
      displayLoadedEnvVars(
        { envFilePath: '.env', env: { FOO: 'bar', BAR: 'baz' } },
        { showValues: true }
      );

      expect(ux.warn).toHaveBeenCalledTimes(1);
      expect(ux.warn).toHaveBeenCalledWith(SENSITIVE_OUTPUT_WARNING);
      expect(ux.stdout).toHaveBeenCalledTimes(1);
      const msg = (ux.stdout as jest.Mock).mock.calls[0][0];
      expect(msg).toContain('Loading Environment Variables');
      expect(msg).toMatch(/Loading 2 environment variables from file \.env:/);
      expect(msg).toContain('FOO=bar');
      expect(msg).toContain('BAR=baz');
      expect(msg).toContain('✔');
    });

    it('sorts keys when showValues is true', () => {
      displayLoadedEnvVars(
        { envFilePath: '.env', env: { ZEE: 'z', ALPHA: 'a' } },
        { showValues: true }
      );

      const msg = (ux.stdout as jest.Mock).mock.calls[0][0] as string;
      expect(msg.indexOf('ALPHA=a')).toBeLessThan(msg.indexOf('ZEE=z'));
    });
  });
});
