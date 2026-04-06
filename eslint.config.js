import globals from 'globals';

export default [
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-alert': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-unreachable': 'warn',
      'no-constant-condition': ['warn', { checkLoops: false }],
      eqeqeq: 'off',
      curly: ['warn', 'multi-line'],
    },
  },
];
