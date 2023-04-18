/* eslint-disable no-console */
import fs from 'fs';
import * as core from '@actions/core';
import axios from 'axios';
import { pkgUp } from 'pkg-up';
import type { PackageJson } from 'type-fest';

// @tsconfig/docusaurus is not versioned using the same semver scheme as the rest of the docusaurus packages, so skipping
const EXCLUDED_PACKAGES = ['@tsconfig/docusaurus'];

async function run(): Promise<void> {
  try {
    if (core.getInput('setup-versions')) {
      console.log('Setting up versions');

      setupVersions();
    } else {
      await testDocusaurusVersion(core.getInput('version'));
    }
  } catch (error) {
    if (isError(error)) {
      core.setFailed(error.message);
    }
  }
}

async function setupVersions(): Promise<string[]> {
  const versionsJsonUrl =
    'https://raw.githubusercontent.com/facebook/docusaurus/main/website/versions.json';
  const response = await axios.get(versionsJsonUrl);
  const versions: string[] = response.data;

  console.log(JSON.stringify(versions, null, 2));

  core.setOutput('docusaurus-versions', versions);

  return versions;
}

function isObject(e: unknown): e is Object {
  return e !== null && typeof e === 'object' && !Array.isArray(e);
}

function isError(e: unknown): e is Error {
  return isObject(e) && 'message' in e;
}

async function getPackageJsonPath(): Promise<string> {
  const packageJsonPath = await pkgUp();

  if (!packageJsonPath) {
    core.setFailed('Could not find package.json');
    return '';
  }

  return packageJsonPath;
}

async function getPackageJson(): Promise<PackageJson> {
  const packageJsonPath = await getPackageJsonPath();

  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

async function writePackageJson(packageJson: PackageJson): Promise<void> {
  const packageJsonPath = await getPackageJsonPath();

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function buildReplacementDepencencyVersion(
  existingVersion: string,
  newVersion: string
): string {
  const firstChar = existingVersion[0];

  // preserve existing floating constraint
  if (['^', '~'].includes(firstChar)) {
    return `${firstChar}${newVersion}`;
  }

  return newVersion;
}

async function testDocusaurusVersion(version: string): Promise<void> {
  console.log(`Testing Docusaurus version ${version}`);

  const packageJson = await getPackageJson();

  if (packageJson.dependencies) {
    for (const [dependency, currentVersion] of Object.entries(
      packageJson.dependencies
    )) {
      if (
        dependency.includes('docusaurus') &&
        !EXCLUDED_PACKAGES.includes(dependency) &&
        currentVersion
      ) {
        packageJson.dependencies[dependency] =
          buildReplacementDepencencyVersion(currentVersion, version);
      }
    }
  }

  if (packageJson.devDependencies) {
    for (const [devDependency, currentVersion] of Object.entries(
      packageJson.devDependencies
    )) {
      if (
        devDependency.includes('docusaurus') &&
        !EXCLUDED_PACKAGES.includes(devDependency) &&
        currentVersion
      ) {
        packageJson.devDependencies[devDependency] =
          buildReplacementDepencencyVersion(currentVersion, version);
      }
    }
  }

  core.debug(JSON.stringify(packageJson, null, 2));

  await writePackageJson(packageJson);
}

run();
