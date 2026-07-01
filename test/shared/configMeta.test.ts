import configMeta from '../../src/shared/configMeta.js';
import { CONFIG_DEFAULT_ENV_FILE_KEY, CONFIG_SHOULD_LOG_KEY } from '../../src/shared/constants.js';

type ConfigMetaEntry = (typeof configMeta)[number];

function findEntry(key: string): ConfigMetaEntry {
  const entry = configMeta.find((e) => e.key === key);
  if (!entry) {
    throw new Error(`Expected configMeta to include entry with key "${key}"`);
  }
  return entry;
}

describe('configMeta (shared/configMeta)', () => {
  it('exports two config entries', () => {
    expect(configMeta).toHaveLength(2);
  });

  describe('should-log-env entry', () => {
    const entry = findEntry(CONFIG_SHOULD_LOG_KEY);

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

  describe('default-env-file entry', () => {
    const entry = findEntry(CONFIG_DEFAULT_ENV_FILE_KEY);

    it('uses CONFIG_DEFAULT_ENV_FILE_KEY as key', () => {
      expect(entry.key).toBe(CONFIG_DEFAULT_ENV_FILE_KEY);
      expect(entry.key).toBe('default-env-file');
    });

    it('has description that mentions the default .env file', () => {
      expect(entry.description.toLowerCase()).toContain('.env');
      expect(entry.description.toLowerCase()).toContain('default');
    });

    it('has failedMessage for invalid input', () => {
      expect(entry.input.failedMessage).toBe('must be a non-empty string path to a .env file');
    });

    describe('input.validator', () => {
      const validator = entry.input.validator;

      it('accepts a plain filename', () => {
        expect(validator('.env.local')).toBe(true);
      });

      it('accepts a relative path', () => {
        expect(validator('config/.env.dev')).toBe(true);
      });

      it('rejects null', () => {
        expect(validator(null)).toBe(false);
      });

      it('rejects undefined', () => {
        expect(validator(undefined as unknown as string)).toBe(false);
      });

      it('rejects an empty string', () => {
        expect(validator('')).toBe(false);
      });

      it('rejects a whitespace-only string', () => {
        expect(validator('   ')).toBe(false);
      });

      it('rejects non-string values', () => {
        expect(validator(1)).toBe(false);
        expect(validator(true)).toBe(false);
      });
    });
  });
});
