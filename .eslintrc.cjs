module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'prefer-const': 'off'
  },
  ignorePatterns: [
    '**/dist/**',
    '**/coverage/**',
    '**/node_modules/**',
    'packages/goalos-py/**',
    'website/**',
    'examples/**',
    '*.html'
  ]
};
