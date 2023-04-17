import fs from 'fs';
import path from 'path';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import axios from 'axios';
import { pkgUp } from 'pkg-up';

type ExecPackageManager = (args: string[]) => Promise<number>;

let execPackageManager: ExecPackageManager;

async function run(): Promise<void> {
  try {
    const versionsJsonUrl =
      'https://raw.githubusercontent.com/facebook/docusaurus/main/website/versions.json';
    const response = await axios.get(versionsJsonUrl);
    const versions: string[] = response.data;

    execPackageManager = getPackageManagerCmd();

    await install();

    for (const version of versions) {
      await testDocusaurusVersion(version);
    }
  } catch (error) {
    if (isError(error)) {
      core.setFailed(error.message);
    }
  }
}

function isObject(e: unknown): e is Object {
  return e !== null && typeof e === 'object' && !Array.isArray(e);
}

function isError(e: unknown): e is Error {
  return isObject(e) && 'message' in e;
}

function getPackageManager(cwd: string = process.cwd()): 'npm' | 'yarn' {
  const hasYarn = fs.existsSync(path.join(cwd, 'yarn.lock'));

  if (hasYarn) {
    return 'yarn';
  }

  return 'npm';
}

function getPackageManagerCmd(
  packageManager: 'npm' | 'yarn' = getPackageManager()
): ExecPackageManager {
  return async (args: string[]) => {
    return await exec.exec(packageManager, args);
  };
}

async function getPackageJson(): Promise<Record<string, unknown>> {
  const packageJsonPath = await pkgUp();

  if (!packageJsonPath) {
    core.setFailed('Could not find package.json');
    return {};
  }

  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

async function install(): Promise<void> {
  if (!fs.existsSync('node_modules')) {
    await execPackageManager(['install']);
  }
}

async function cacheNodeModules(): Promise<void> {
  await io.cp('node_modules', 'node_modules_temp', {
    recursive: true,
  });
}

async function restoreNodeModules(): Promise<void> {
  await io.rmRF('node_modules');
  await io.cp('node_modules_temp', 'node_modules', {
    recursive: true,
  });
}

async function testDocusaurusVersion(version: string): Promise<void> {
  core.info(`Testing Docusaurus version ${version}`);

  await cacheNodeModules();

  const packageJson = await getPackageJson();

  if (packageJson.dependencies) {
    for (const [key] of Object.entries(packageJson.dependencies)) {
      if (key.includes('docusaurus')) {
        execPackageManager(['add', `${key}@${version}`]);
      }
    }
  }

  if (packageJson.devDependencies) {
    for (const [key] of Object.entries(packageJson.devDependencies)) {
      if (key.includes('docusaurus')) {
        execPackageManager(['add', `${key}@${version}`]);
      }
    }
  }

  const exitCode = await execPackageManager(['test']);

  if (exitCode !== 0) {
    core.setFailed(`Tests failed for Docusaurus version ${version}`);
  }

  await restoreNodeModules();
}

run();
