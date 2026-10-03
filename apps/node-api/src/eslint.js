/**
 * ESLint configuration for the nodejs-ecom project.
 *
 * This file defines the ESLint rules and environment for the project.
 * Note: For ESLint v9+ flat config format, this can be imported and
 * used programmatic configuration or referenced from a root-level
 * eslint.config.js file.
 */

export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'comma-dangle': ['error', 'always-multiline'],
      'arrow-body-style': ['error', 'as-needed'],
    },
  },
  {
    // Explicitly ignore node_modules
    ignores: ['node_modules/**', 'dist/**', 'build/**'],
  },
];
