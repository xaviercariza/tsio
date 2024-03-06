const { resolve } = require('node:path')

const project = resolve(process.cwd(), 'tsconfig.json')

/*
 * This is a custom ESLint configuration for use with
 * Next.js apps.
 *
 * This config extends the Vercel Engineering Style Guide.
 * For more information, see https://github.com/vercel/style-guide
 *
 */

module.exports = {
  extends: [
    '@vercel/style-guide/eslint/node',
    '@vercel/style-guide/eslint/typescript',
    '@vercel/style-guide/eslint/browser',
    '@vercel/style-guide/eslint/react',
    '@vercel/style-guide/eslint/next',
    'eslint-config-turbo',
  ].map(require.resolve),
  parserOptions: {
    project,
  },
  globals: {
    React: true,
    JSX: true,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: ['node_modules/', 'dist/', 'tsup.config.ts', '.eslintrc.cjs'],
  // add rules configurations here
  rules: {
    'import/no-default-export': 'off',
  },
}

// module.exports = {
//   extends: [
//     'eslint:recommended',
//     'plugin:@typescript-eslint/recommended',
//     'next',
//     'turbo',
//     'prettier',
//   ],
//   rules: {
//     '@next/next/no-html-link-for-pages': 'off',
//   },
//   parser: '@typescript-eslint/parser',
//   parserOptions: {
//     babelOptions: {
//       presets: [require.resolve('next/babel')],
//     },
//   },
//   ignorePatterns: ['dist/*'],
// }
