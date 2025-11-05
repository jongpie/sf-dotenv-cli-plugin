import { jest } from '@jest/globals';

describe('index.ts', () => {
  it('should export prerun hook', async () => {
    // Test that the module can be imported
    const { prerun } = await import('../index');

    // Verify that prerun is a function
    expect(typeof prerun).toBe('function');

    // Verify that it's an async function
    expect(prerun.constructor.name).toBe('AsyncFunction');
  });

  it('should export prerun as named export', async () => {
    // Test named export
    const module = await import('../index');

    // Verify that prerun is exported as named export
    expect(typeof module.prerun).toBe('function');
    expect(module.prerun.constructor.name).toBe('AsyncFunction');
  });

  it('should be able to call prerun hook with mock parameters', async () => {
    const { prerun } = await import('../index');

    const mockHookContext = {
      config: {} as any,
      debug: jest.fn(),
      error: jest.fn(),
      exit: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
    };

    const mockParams = {
      Command: {} as any,
      config: {} as any,
      argv: ['test-command'],
      context: mockHookContext,
    };

    // Should not throw when called with valid parameters
    await expect(prerun.call(mockHookContext, mockParams)).resolves.not.toThrow();
  });

  it('should handle early returns gracefully', async () => {
    const { prerun } = await import('../index');

    const mockHookContext = {
      config: {} as any,
      debug: jest.fn(),
      error: jest.fn(),
      exit: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
    };

    // Test with help flag (should return early)
    const mockParamsWithHelp = {
      Command: {} as any,
      config: {} as any,
      argv: ['test-command', '--help'],
      context: mockHookContext,
    };

    await expect(prerun.call(mockHookContext, mockParamsWithHelp)).resolves.toBeUndefined();
  });
});
