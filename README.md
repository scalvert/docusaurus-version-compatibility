# GitHub Action to Test Compatibility with Multiple Docusaurus Versions

[![Build & Test](https://github.com/scalvert/docusaurus-version-compatibility/actions/workflows/test.yml/badge.svg)](https://github.com/scalvert/docusaurus-version-compatibility/actions/workflows/test.yml)

<!-- action-docs-description -->
## Description

A Docusaurus version compatibility tester
<!-- action-docs-description -->

Docusaurus Version Tester is a useful GitHub Action for Docusaurus plugin or theme developers, as it streamlines compatibility testing across multiple Docusaurus versions. By automating the testing process against each published version of Docusaurus, it ensures that plugins and themes maintain compatibility across those versions.

<!-- action-docs-inputs -->
## Inputs

| parameter | description | required | default |
| --- | --- | --- | --- |
| version | The version of Docusaurus to test | `false` |  |
| setup-versions | Sets up the version compatibility test with the associated versions | `false` |  |
<!-- action-docs-inputs -->

<!-- action-docs-outputs -->
## Outputs

| parameter | description |
| --- | --- |
| docusaurus-versions | The versions of Docusaurus to test |
<!-- action-docs-outputs -->

## Usage

See [action.yml](action.yml)

Basic usage with yarn:

```yaml
name: Docusarurus Version Compatibility Test

on:
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch: {}

jobs:
  compatibility-setup:
    runs-on: ubuntu-latest
    outputs:
      docusaurus-versions: ${{ steps.set-matrix.outputs.docusaurus-versions }}
    steps:
      - name: Version compatibility test setup
        id: set-matrix
        uses: scalvert/docusaurus-version-compatibility@main
        with:
          setup-versions: true

  compatibility-test:
    runs-on: ubuntu-latest
    name: Docusaurus @${{ matrix.docusaurus-version }}

    needs: compatibility-setup

    strategy:
      matrix:
        docusaurus-version: ${{ fromJson(needs.compatibility-setup.outputs.docusaurus-versions) }}

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v2
        with:
          node-version: 16
      - uses: scalvert/docusaurus-version-compatibility@main
        with:
          version: ${{ matrix.docusaurus-version }}
      - run: yarn --no-immutable
      - run: yarn test

```

Basic usage with npm:

```yaml
name: Docusarurus Version Compatibility Test

on:
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch: {}

jobs:
  compatibility-setup:
    runs-on: ubuntu-latest
    outputs:
      docusaurus-versions: ${{ steps.set-matrix.outputs.docusaurus-versions }}
    steps:
      - name: Version compatibility test setup
        id: set-matrix
        uses: scalvert/docusaurus-version-compatibility@main
        with:
          setup-versions: true

  compatibility-test:
    runs-on: ubuntu-latest
    name: Docusaurus @${{ matrix.docusaurus-version }}

    needs: compatibility-setup

    strategy:
      matrix:
        docusaurus-version: ${{ fromJson(needs.compatibility-setup.outputs.docusaurus-versions) }}

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v2
        with:
          node-version: 16
      - uses: scalvert/docusaurus-version-compatibility@main
        with:
          version: ${{ matrix.docusaurus-version }}
      - run: npm install --no-package-lock
      - run: npm test
```
