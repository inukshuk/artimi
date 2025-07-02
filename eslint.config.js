import neostandard from 'neostandard'

export default [
  ...neostandard({ noJsx: true }),
  {
    ignores: [
      'src/config.js'
    ]
  },
  {
    rules: {
      'accessor-pairs': 0,
      'curly': 0,
      'no-sequences': [2, { allowInParentheses: true }],
      'no-var': 0,
      'prefer-const': 0,
      '@stylistic/new-parens': 0,
      '@stylistic/generator-star-spacing': [2, { before: true }],
      '@stylistic/quote-props': 0
    }
  }
]
