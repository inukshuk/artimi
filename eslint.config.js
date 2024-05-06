import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    ignores: [
      'src/config.js'
    ]
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      }
    },
    rules: {
      'quotes': [2, 'single', 'avoid-escape'],
      'wrap-regex': 2,
    }
  }
]
