"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const axios_1 = __importDefault(require("axios"));
const fixturify_project_1 = require("fixturify-project");
const utils_1 = require("../src/utils");
(0, vitest_1.describe)('utils', () => {
    let originalCwd;
    let project;
    (0, vitest_1.beforeEach)(async () => {
        project = new fixturify_project_1.Project('test', '0.0.0');
        await project.write();
        originalCwd = process.cwd();
        process.chdir(project.baseDir);
    });
    (0, vitest_1.afterEach)(() => {
        project.dispose();
        process.chdir(originalCwd);
    });
    (0, vitest_1.test)('setupVersions', async () => {
        const axiosSpy = vitest_1.vi.spyOn(axios_1.default, 'get');
        axiosSpy.mockResolvedValue({ data: ['2.0.0', '1.14.0'] });
        const versions = await (0, utils_1.setupVersions)();
        (0, vitest_1.expect)(versions).toEqual(['2.0.0', '1.14.0']);
        axiosSpy.mockRestore();
    });
    (0, vitest_1.test)('isError', () => {
        const error = new Error('Test Error');
        (0, vitest_1.expect)((0, utils_1.isError)(error)).toBe(true);
        (0, vitest_1.expect)((0, utils_1.isError)({ message: 'Test Error' })).toBe(true);
        (0, vitest_1.expect)((0, utils_1.isError)({})).toBe(false);
        (0, vitest_1.expect)((0, utils_1.isError)(null)).toBe(false);
        (0, vitest_1.expect)((0, utils_1.isError)('Test Error')).toBe(false);
    });
    (0, vitest_1.test)('getPackageJsonPath', async () => {
        await project.write({
            'package.json': JSON.stringify({
                name: 'test',
                version: '0.0.0',
            }),
        });
        const packageJsonPath = await (0, utils_1.getPackageJsonPath)();
        (0, vitest_1.expect)(packageJsonPath).toMatch(/package\.json$/);
    });
    (0, vitest_1.test)('testDocusaurusVersion', async () => {
        await (0, utils_1.writePackageJson)({
            name: 'test',
            version: '0.0.0',
            dependencies: {
                'docusaurus-plugin': '^1.0.0',
            },
            devDependencies: {
                'docusaurus-theme': '^2.0.0',
            },
        });
        await (0, utils_1.testDocusaurusVersion)('1.1.0');
        (0, vitest_1.expect)(await (0, utils_1.getPackageJson)()).toMatchInlineSnapshot(`
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
    (0, vitest_1.test)('buildReplacementDepencencyVersion', () => {
        (0, vitest_1.expect)((0, utils_1.buildReplacementDepencencyVersion)('^1.0.0', '1.1.0')).toBe('^1.1.0');
        (0, vitest_1.expect)((0, utils_1.buildReplacementDepencencyVersion)('~1.0.0', '1.1.0')).toBe('~1.1.0');
        (0, vitest_1.expect)((0, utils_1.buildReplacementDepencencyVersion)('1.0.0', '1.1.0')).toBe('1.1.0');
    });
});
