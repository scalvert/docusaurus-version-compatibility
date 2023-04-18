# GitHub Action to Test Compatibility with Multiple Docusaurus Versions

<p align="left">
  <a href="https://github.com/scalvert/docusaurus-version-compatibility"><img alt="GitHub Actions status" src="https://github.com/scalvert/docusaurus-version-compatibility/workflows/test/badge.svg"></a>
</p>

<!-- action-docs-description -->
## Description

A Docusaurus version compatibility tester
<!-- action-docs-description -->

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

Basic:

```yaml
name: Docusarurus Version Compatibility Test

on:
  workflow_dispatch: {}

jobs:
  compatibility-setup:
    runs-on: ubuntu-latest
    outputs:
      docusaurus-versions: ${{ steps.compatibility-setup.outputs.docusaurus-versions }}
    steps:
      - name: Version compatibility test setup
        id: compatibility-setup
        uses: scalvert/docusaurus-version-compatibility@main
        with:
          setup-versions: true
      - name: Echo matrix output for debugging
        run: |
          echo "Versions output: ${{ steps.compatibility-setup.outputs.docusaurus-versions }}"

  compatibility-test:
    runs-on: ubuntu-latest
    name: Docusaurus @${{ matrix.docusaurus-version }}

    needs: compatibility-setup

    strategy:
      matrix:
        docusaurus-version: ${{ fromJson(needs.compatibility-setup.outputs.docusaurus-versions) }}

    steps:
      - uses: actions/checkout@v3
      - uses: volta-cli/action@v4
      - uses: scalvert/docusaurus-version-compatibility@main
        with:
          version: ${{ matrix.docusaurus-version }}
      - run: yarn --no-immutable
      - run: yarn test
```