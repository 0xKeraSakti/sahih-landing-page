import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

/**
 * Architecture boundary. Imports flow one way only:
 *
 *   app -> pages -> features -> shared
 *
 * A feature never reaches into another feature, and nothing reaches past a
 * feature's index.ts into its internals.
 *
 * no-restricted-imports does not merge across config blocks, so each block
 * below restates every pattern that applies to it.
 */
const PRIVATE_FEATURE_INTERNALS = {
  group: ['@/features/*/ui/*', '@/features/*/model/*', '@/features/*/lib/*'],
  message: 'Import a feature through its index.ts. Deep paths are private.',
}

const NO_UPWARD = {
  group: ['@/app', '@/app/*', '@/pages', '@/pages/*'],
  message: 'This layer must not import upward from app or pages.',
}

const NO_CROSS_FEATURE = {
  group: ['@/features/*'],
  message: 'A feature must not import another feature. Move the shared piece into @/shared.',
}

const restrict = (patterns) => ['error', { patterns }]

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrict([PRIVATE_FEATURE_INTERNALS, NO_UPWARD]) },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrict([NO_CROSS_FEATURE, NO_UPWARD]) },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict([
        {
          group: ['@/features/*', '@/pages/*', '@/app/*'],
          message: 'Shared code must not depend on any layer above it.',
        },
      ]),
    },
  }
)
