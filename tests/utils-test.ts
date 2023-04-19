import { describe, beforeEach, afterEach, test, expect, vi } from 'vitest';
import axios from 'axios';
import { Project } from 'fixturify-project';
import {
  setupVersions,
  isError,
  getPackageJsonPath,
  testDocusaurusVersion,
  buildReplacementDepencencyVersion,
  getPackageJson,
  writePackageJson,
} from '../src/utils';

describe('utils', () => {
  let originalCwd: string;
  let project: Project;

  beforeEach(async () => {
    project = new Project('test', '0.0.0');

    await project.write();

    originalCwd = process.cwd();
    process.chdir(project.baseDir);
  });

  afterEach(() => {
    project.dispose();

    process.chdir(originalCwd);
  });

  test('setupVersions', async () => {
    const axiosSpy = vi.spyOn(axios, 'get');
    axiosSpy.mockResolvedValue({ data: ['2.0.0', '1.14.0'] });

    const versions = await setupVersions();
    expect(versions).toEqual(['2.0.0', '1.14.0']);

    axiosSpy.mockRestore();
  });

  test('isError', () => {
    const error = new Error('Test Error');

    expect(isError(error)).toBe(true);
    expect(isError({ message: 'Test Error' })).toBe(true);
    expect(isError({})).toBe(false);
    expect(isError(null)).toBe(false);
    expect(isError('Test Error')).toBe(false);
  });

  test('getPackageJsonPath', async () => {
    await project.write({
      'package.json': JSON.stringify({
        name: 'test',
        version: '0.0.0',
      }),
    });

    const packageJsonPath = await getPackageJsonPath();
    expect(packageJsonPath).toMatch(/package\.json$/);
  });

  test('testDocusaurusVersion', async () => {
    await writePackageJson({
      name: 'test',
      version: '0.0.0',
      dependencies: {
        'docusaurus-plugin': '^1.0.0',
      },
      devDependencies: {
        'docusaurus-theme': '^2.0.0',
      },
    });

    await testDocusaurusVersion('1.1.0');

    expect(await getPackageJson()).toMatchInlineSnapshot(`
      {
        "dependencies": {
          "docusaurus-plugin": "^1.1.0",
        },
        "devDependencies": {
          "docusaurus-theme": "^1.1.0",
        },
        "name": "test",
        "version": "0.0.0",
      }
    `);
  });

  test('buildReplacementDepencencyVersion', () => {
    expect(buildReplacementDepencencyVersion('^1.0.0', '1.1.0')).toBe('^1.1.0');
    expect(buildReplacementDepencencyVersion('~1.0.0', '1.1.0')).toBe('~1.1.0');
    expect(buildReplacementDepencencyVersion('1.0.0', '1.1.0')).toBe('1.1.0');
  });
});
