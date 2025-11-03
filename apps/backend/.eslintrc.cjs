module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:import/recommended', 'prettier'],
  env: {
    node: true,
    jest: true
  },
  rules: {
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true }
      }
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  }
};


