import fs from 'fs';
import axios from 'axios';
import { pkgUp } from 'pkg-up';
import type { PackageJson } from 'type-fest';
import * as core from '@actions/core';

const EXCLUDED_PACKAGES = ['@tsconfig/docusaurus'];

export const IS_POST = !!core.getState('isPost');

export async function setupVersions(): Promise<string[]> {
  const versionsJsonUrl =
    'https://raw.githubusercontent.com/facebook/docusaurus/main/website/versions.json';
  const response = await axios.get(versionsJsonUrl);
  const versions: string[] = response.data;

  core.debug(`Docusaurus versions: ${versions}`);

  core.setOutput('docusaurus-versions', versions);

  return versions;
}

export function isError(e: unknown): e is Error {
  return isObject(e) && 'message' in e;
}

export async function getPackageJsonPath(): Promise<string> {
  const packageJsonPath = await pkgUp();

  if (!packageJsonPath) {
    core.setFailed('Could not find package.json');
    return '';
  }

  return packageJsonPath;
}

export async function testDocusaurusVersion(version: string): Promise<void> {
  core.info(`Testing Docusaurus version ${version}`);

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

  core.info(JSON.stringify(packageJson, null, 2));

  await writePackageJson(packageJson);
}

export function buildReplacementDepencencyVersion(
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

export async function getPackageJson(): Promise<PackageJson> {
  const packageJsonPath = await getPackageJsonPath();

  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

export async function writePackageJson(
  packageJson: PackageJson
): Promise<void> {
  const packageJsonPath = await getPackageJsonPath();

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function isObject(e: unknown): e is Object {
  return e !== null && typeof e === 'object' && !Array.isArray(e);
}
