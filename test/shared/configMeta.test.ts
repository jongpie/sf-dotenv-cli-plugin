import configMeta from '../../src/shared/configMeta.js';
import { CONFIG_SHOULD_LOG_KEY } from '../../src/shared/constants.js';

describe('configMeta (shared/configMeta)', () => {
  it('exports a single config entry', () => {
    expect(configMeta).toHaveLength(1);
  });

  describe('config entry', () => {
    const entry = configMeta[0];

    it('uses CONFIG_SHOULD_LOG_KEY as key', () => {
      expect(entry.key).toBe(CONFIG_SHOULD_LOG_KEY);
      expect(entry.key).toBe('should-log-env');
    });

    it('has description about printing loaded env variables', () => {
      expect(entry.description).toContain('loaded env variables');
      expect(entry.description).toContain('SF CLI command');
    });

    it('has failedMessage for invalid input', () => {
      expect(entry.input.failedMessage).toBe('must provide either "true" or "false"');
    });

    describe('input.validator', () => {
      const validator = entry.input.validator;

      it('accepts string "true"', () => {
        expect(validator('true')).toBe(true);
      });

      it('accepts string "false"', () => {
        expect(validator('false')).toBe(true);
      });

      it('accepts boolean true (toString "true")', () => {
        expect(validator(true)).toBe(true);
      });

      it('accepts boolean false (toString "false")', () => {
        expect(validator(false)).toBe(true);
      });

      it('rejects null', () => {
        expect(validator(null)).toBe(false);
      });

      it('rejects undefined', () => {
        expect(validator(undefined as unknown as string)).toBe(false);
      });

      it('rejects other strings', () => {
        expect(validator('yes')).toBe(false);
        expect(validator('no')).toBe(false);
        expect(validator('')).toBe(false);
        expect(validator('1')).toBe(false);
        expect(validator('0')).toBe(false);
      });

      it('rejects numbers', () => {
        expect(validator(1)).toBe(false);
        expect(validator(0)).toBe(false);
      });
    });
  });
});
