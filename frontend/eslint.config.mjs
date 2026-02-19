// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt([
  // Your custom configs here
  {
    name: 'crunux-eslint-config',
    files: ['**/*.{ts,vue}'],
    ignores: [
      '**/node_modules/**',
      '**/.nuxt/**',
      '**/dist/**',
      '__tests__/**'

    ],
    rules: {

      // 'indent': ['error', 'tab'],
      'vue/html-indent': ['error', 'tab'],
      'vue/script-indent': ['error', 'tab'],
      'quotes': ['error', 'single'],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'no-tabs': 'off',
      '@stylistic/no-tabs': 'off',
      // '@stylistic/indent': ['error', 'tab'],
      'indent': 'off',
      '@stylistic/indent': ['error', 'tab', {
        SwitchCase: 1,
        VariableDeclarator: 1,
        outerIIFEBody: 1,
        MemberExpression: 1,
        FunctionDeclaration: { parameters: 1, body: 1 },
        FunctionExpression: { parameters: 1, body: 1 },
        CallExpression: { arguments: 1 },
        ArrayExpression: 1,
        ObjectExpression: 1,
        ImportDeclaration: 1,
        flatTernaryExpressions: false,
        offsetTernaryExpressions: false,
        ignoreComments: false
      }],
      // '@stylistic/semi': ['error', 'always']

      // --- Calidad y Vue 3 setup ---
      'no-console': 'error',
      'no-debugger': 'error',
      'vue/no-unused-components': 'warn',
      'vue/no-unused-vars': 'warn',
      'vue/no-mutating-props': 'error',
      'vue/require-default-prop': 'off',
      'vue/require-prop-types': 'off',
      'vue/multi-word-component-names': 'off'

      // Esta regla es clave para <script setup>
      // 'vue/script-setup-uses-vars': 'error'
      // 'no-console': 'error',
      // 'no-debugger': 'error',
      // 'vue/no-unused-components': 'warn',
      // 'vue/no-unused-vars': 'warn',
      // 'vue/no-mutating-props': 'error',
      // 'vue/multi-word-component-names': 'off',
      // 'vue/require-default-prop': 'off',
      // 'vue/require-prop-types': 'off',
      // 'quotes': ['error', 'single'],
      // 'semi': ['error', 'always'],
      // 'indent': ['error', 'tab'],
      // 'comma-dangle': ['error', 'never'],
      // 'object-curly-spacing': ['error', 'always'],
      // 'array-bracket-spacing': ['error', 'never'],
      // 'no-trailing-spaces': 'error',
      // 'eol-last': ['error', 'always']
    }
  }
]
)
