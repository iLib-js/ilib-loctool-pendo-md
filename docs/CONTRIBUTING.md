# Contributing

## Node version

This package is developed using NodeJS v18 LTS. `@types/node@18` and `@tsconfig/node18` are used to ensure transpiled code compatibility. [`nvm`](https://github.com/nvm-sh/nvm) is recommended for runtime version management.

Package manager used during development is [`yarn v1`](https://classic.yarnpkg.com/lang/en/docs/install/).

## Setup

1. Install the necessary dependencies by running `yarn install`.
2. Install Git commit hooks (Husky) by running `yarn prepare`.

## Formatting

Formatting is handled automatically through [`prettier`](https://prettier.io/) installed in the pre-commit hook.
