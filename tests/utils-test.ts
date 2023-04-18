import { describe, test, vi } from 'vitest';
import fs from 'fs';
import axios from 'axios';
import {
  setupVersions,
  isError,
  getPackageJsonPath,
  testDocusaurusVersion,
  buildReplacementDepencencyVersion,
} from '../src/utils';

describe('utils', () => {
  test('setupVersions', async ({ expect }) => {
    const axiosSpy = vi.spyOn(axios, 'get');
    axiosSpy.mockResolvedValue({ data: ['2.0.0', '1.14.0'] });

    const versions = await setupVersions();
    expect(versions).toEqual(['2.0.0', '1.14.0']);

    axiosSpy.mockRestore();
  });

  test('isError', ({ expect }) => {
    const error = new Error('Test Error');
    expect(isError(error)).toBe(true);
    expect(isError({ message: 'Test Error' })).toBe(true);
    expect(isError({})).toBe(false);
    expect(isError(null)).toBe(false);
    expect(isError('Test Error')).toBe(false);
  });

  test('getPackageJsonPath', async ({ expect }) => {
    const packageJsonPath = await getPackageJsonPath();
    expect(packageJsonPath).toMatch(/package\.json$/);
  });

  test('testDocusaurusVersion', async ({ expect }) => {
    const packageJson = {
      dependencies: {
        'docusaurus-plugin': '^1.0.0',
      },
      devDependencies: {
        'docusaurus-theme': '^2.0.0',
      },
    };

    const readFileSyncSpy = vi.spyOn(fs, 'readFileSync');
    const writeFileSyncSpy = vi.spyOn(fs, 'writeFileSync');
    readFileSyncSpy.mockReturnValue(JSON.stringify(packageJson));

    await testDocusaurusVersion('1.1.0');

    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"docusaurus-plugin": "^1.1.0"')
    );
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"docusaurus-theme": "^2.0.0"')
    );

    readFileSyncSpy.mockRestore();
    writeFileSyncSpy.mockRestore();
  });

  test('buildReplacementDepencencyVersion', ({ expect }) => {
    expect(buildReplacementDepencencyVersion('^1.0.0', '1.1.0')).toBe('^1.1.0');
    expect(buildReplacementDepencencyVersion('~1.0.0', '1.1.0')).toBe('~1.1.0');
    expect(buildReplacementDepencencyVersion('1.0.0', '1.1.0')).toBe('1.1.0');
  });
});
