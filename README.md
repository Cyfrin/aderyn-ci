# Aderyn - Continuous Integration

## About

Peforms Static analysis on Solidity codebases in CI to catch potential vulnerabilities before committing code.
The main project that powers this is [Adeyrn](https://github.com/Cyfrin/aderyn). Check it out for more information

## Recommended workflow

1. Install the officially supported [Aderyn VSCode Extension](https://marketplace.visualstudio.com/items?itemName=Cyfrin.aderyn)
2. Get comfortable with attending to the instant local feedback loop. (Acknowledge it either by fixing the issue or explicitly [ignoring](https://cyfrin.gitbook.io/cyfrin-docs/directives-to-ignore-specific-lines) it)
3. Add the following to your CI to catch unacknowledged issues before merging PRs.

## How to use

### Pre-requisites

- Dependencies must be installed
- Project must compile successfully

### CI Step

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

> [!NOTE]
> Only Github is supported currently.

## Example - Foundry Project

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

## Snapshot

<img width="1345" alt="ci-assistant" src="https://github.com/user-attachments/assets/0d6bdfa0-ecb4-4a24-a86e-62a8399a77d0" />




