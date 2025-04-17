# Aderyn - Continuous Integration

> [!CAUTION]
>  Aderyn CI is under active development and is not guaranteed to work

To test your project using GitHub Actions, here is a sample workflow for a Foundry project:

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
        uses: @Cyfrin/aderyn-ci
        with:
          fail-on: high
```

