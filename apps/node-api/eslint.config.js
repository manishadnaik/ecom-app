import eslintConfig from './src/eslint.js';

/**
 * Root-level ESLint flat config that imports the configuration
 * defined in src/eslint.js.
 *
 * This allows ESLint to automatically pick up the project's
 * linting configuration when running `npx eslint` or `npm run lint`.
 */
export default [
  ...eslintConfig,
];
