import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import stylistic from '@stylistic/eslint-plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals'),
  {
    ignores: [
      'node_modules/**',
      '.idea/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/indent': [
        1,
        2, // 2-space indentation
        {
          'SwitchCase': 1,
          'VariableDeclarator': 'first',
          'MemberExpression': 1,
          'FunctionExpression': {'body': 1, 'parameters': 1, 'returnType': 1},
          'CallExpression': {'arguments': 'first'},
          'ArrayExpression': 1,
          'ObjectExpression': 1,
          'ImportDeclaration': 1,
          'flatTernaryExpressions': true,
          'offsetTernaryExpressions': true,
          'ignoreComments': false
        }
      ],
      '@stylistic/indent-binary-ops': [1, 2],
      '@stylistic/jsx-indent-props': [1, 'first'],
      '@stylistic/array-bracket-newline': [1, 'consistent'],
      '@stylistic/semi': [1, 'never'],
      '@stylistic/max-len': [1, {
        'code': 100,
        'ignoreComments': true,
        'ignoreTrailingComments': true,
        'ignoreUrls': true,
        'ignoreStrings': true,
        'ignoreTemplateLiterals': true
      }],
      '@stylistic/quotes': [1, 'single'],
      '@stylistic/jsx-quotes': [1, 'prefer-double'],
      '@stylistic/jsx-curly-spacing': [1, { 'when': 'never', 'children': true }],
      '@stylistic/jsx-equals-spacing': [1],
      '@stylistic/no-multi-spaces': [1],
      '@stylistic/jsx-tag-spacing': [1, { 'beforeClosing': 'never' }],
      'react/display-name': 'off'
    }
  }
]

export default eslintConfig
