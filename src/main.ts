import * as core from '@actions/core';
import {
  setupVersions,
  testDocusaurusVersion,
  isError,
  IS_POST,
} from './utils';

async function run(): Promise<void> {
  try {
    if (core.getInput('setup-versions')) {
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

async function postRun(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const coreVersion = require('@docusaurus/core/package').version;

  core.info(`Docusaurus version tested: ${coreVersion}`);
}

if (!IS_POST) {
  run();
} else {
  postRun();
}
