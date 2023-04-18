import fs from 'fs';
import path from 'path';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import axios from 'axios';
import { pkgUp } from 'pkg-up';

type ExecPackageManager = (args: string[]) => Promise<number>;
type PackageManagerName = 'yarn' | 'npm';
type PackageManagerOptions = {
  name: PackageManagerName;
  installCmd: string;
  lockFileName: 'yarn.lock' | 'package-lock.json';
  cmd: ExecPackageManager;
  saveDevOption: string;
};

const CACHE_KEY = 'docusaurus-version-compatibility';
// @tsconfig/docusaurus is not versioned using the same semver scheme as the rest of the docusaurus packages, so skipping
const EXCLUDED_PACKAGES = ['@tsconfig/docusaurus'];
let packageManager: PackageManagerOptions;

async function run(): Promise<void> {
  try {
    const versionsJsonUrl =
      'https://raw.githubusercontent.com/facebook/docusaurus/main/website/versions.json';
    const response = await axios.get(versionsJsonUrl);
    const versions: string[] = response.data;

    packageManager = getPackageManager();

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

function getPackageManager(cwd: string = process.cwd()): PackageManagerOptions {
  const hasYarn = fs.existsSync(path.join(cwd, 'yarn.lock'));

  if (hasYarn) {
    return {
      name: 'yarn',
      installCmd: 'add',
      saveDevOption: '--dev',
      lockFileName: 'yarn.lock',
      cmd: getPackageManagerCmd('yarn'),
    };
  }

  return {
    name: 'npm',
    installCmd: 'install',
    saveDevOption: '--save-dev',
    lockFileName: 'package-lock.json',
    cmd: getPackageManagerCmd('npm'),
  };
}

function getPackageManagerCmd(
  packageManagerName: PackageManagerName
): ExecPackageManager {
  return async (args: string[]) => {
    return await exec.exec(packageManagerName, args);
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
    await packageManager.cmd(['install']);
  }
}

async function setupTest(): Promise<void> {
  await io.cp('package.json', `package.json.${CACHE_KEY}`);
  await io.cp(
    packageManager.lockFileName,
    `${packageManager.lockFileName}.${CACHE_KEY}`
  );
  await io.cp('node_modules', `node_modules.${CACHE_KEY}`, {
    recursive: true,
  });
}

async function teardownTest(): Promise<void> {
  await io.rmRF('package.json');
  await io.cp(`package.json.${CACHE_KEY}`, 'package.json');
  await io.rmRF(packageManager.lockFileName);
  await io.cp(
    `${packageManager.lockFileName}.${CACHE_KEY}`,
    packageManager.lockFileName
  );
  await io.rmRF('node_modules');
  await io.cp('node_modules_temp', 'node_modules', {
    recursive: true,
  });
}

async function testDocusaurusVersion(version: string): Promise<void> {
  core.info(`Testing Docusaurus version ${version}`);

  await setupTest();

  let dependencies: string[] = [];
  let devDependencies: string[] = [];
  const packageJson = await getPackageJson();
  const buildPackages = (dependency: string): string =>
    `${dependency}@${version}`;

  if (packageJson.dependencies) {
    dependencies = Object.keys(packageJson.dependencies).filter(
      (dependency: string) => {
        return dependency.includes('docusaurus');
      }
    );

    if (dependencies.length > 0) {
      packageManager.cmd([
        packageManager.installCmd,
        dependencies.map(buildPackages).join(' '),
      ]);
    }
  }

  if (packageJson.devDependencies) {
    devDependencies = Object.keys(packageJson.devDependencies).filter(
      (dependency: string) => {
        return (
          dependency.includes('docusaurus') &&
          !EXCLUDED_PACKAGES.includes(dependency)
        );
      }
    );

    if (devDependencies.length > 0) {
      packageManager.cmd([
        packageManager.installCmd,
        packageManager.saveDevOption,
        devDependencies.map(buildPackages).join(' '),
      ]);
    }
  }

  const exitCode = await packageManager.cmd(['test']);

  if (exitCode !== 0) {
    core.setFailed(`Tests failed for Docusaurus version ${version}`);
  }

  await teardownTest();
}

run();
