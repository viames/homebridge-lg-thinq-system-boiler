import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'diagnostics/**'] },
  {
    rules: {
      quotes: ['error', 'single'],
      indent: ['error', 2, { SwitchCase: 0 }],
      'linebreak-style': ['error', 'unix'],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      eqeqeq: ['error', 'smart'],
      curly: ['error', 'all'],
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],
    },
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
