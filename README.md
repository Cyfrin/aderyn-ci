# Aderyn - Continuous Integration

> [!IMPORTANT]
> Aderyn CI Assistant is retired and no longer maintained. Do not add this action
> to new workflows. Aderyn's CLI release downloads have been withdrawn and its
> npm package is retired, so existing runs that install Aderyn may fail.

## Existing workflows

Remove or replace any workflow step that uses `Cyfrin/aderyn-ci`, including steps
pinned to a version tag or commit SHA. Review the workflow's remaining checks so
it no longer depends on Aderyn's results.

Removing the GitHub Marketplace listing does not disable references to existing
tags or commit SHAs, or remove this action from your workflows. Migrating those
workflows is a separate task.

## Historical usage

The documentation below is retained to help identify and migrate existing
configurations. It is not a supported installation guide.

This action used [Aderyn](https://github.com/Cyfrin/aderyn) to perform static
analysis on Solidity codebases in CI.

### Pre-requisites

- Dependencies must be installed
- Project must compile successfully

### Historical CI step

```yml
- name: Aderyn Check
  uses: Cyfrin/aderyn-ci@v0
  with:
    fail-on: high
```

Available input variations:
- `fail-on`
- `warn-on`

The former fails the CI step while latter only emits warnings that can be seen in the Actions summary.
Both can take up the following values - `high`, `low` or `any`

## Historical example - Foundry Project

```yml
on: [push]

name: test

jobs:
  check:
    name: Foundry project
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1
        with:
          version: stable

      - name: Run tests
        run: forge test -vvv

      - name: Aderyn Check
        uses: Cyfrin/aderyn-ci@v0
        with:
          fail-on: high
```

## Historical snapshot

<img width="1345" alt="ci-assistant" src="https://github.com/user-attachments/assets/0d6bdfa0-ecb4-4a24-a86e-62a8399a77d0" />




