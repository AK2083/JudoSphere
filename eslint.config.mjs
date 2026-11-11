import storybook from 'eslint-plugin-storybook'

import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import security from 'eslint-plugin-security'
import unusedImports from 'eslint-plugin-unused-imports'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import jsdoc from 'eslint-plugin-jsdoc'

export default defineConfig([
  {
    ignores: [
      'node_modules',
      'dist',
      'dist-ssr',
      'coverage',
      'playwright-report',
      'test-results',
      '.vscode',
      '*.min.js',
      'storybook-static',
      'src-tauri'
    ]
  },
  {
    files: ['src/**/*.{js,mjs,cjs}'],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,vue}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off'
    }
  },
  {
    files: ['*.config.{js,mjs,cjs,ts}', 'vite.config.ts'],
    plugins: { security },
    languageOptions: {
      sourceType: 'module',
      globals: globals.node
    },
    rules: {
      ...security.configs.recommended.rules,
      '@typescript-eslint/no-require-imports': 'off',
      'security/detect-object-injection': 'off'
    }
  },
  {
    files: ['*.config.{js,mjs,cjs,ts}', 'vite.config.ts'],
    plugins: { jsdoc },
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true
          },
          contexts: [
            'ExportNamedDeclaration > TSInterfaceDeclaration',
            'ExportNamedDeclaration > TSTypeAliasDeclaration',
            'ExportNamedDeclaration > VariableDeclaration',
            'ExportDefaultDeclaration > VariableDeclaration',
            'ExportDefaultDeclaration > FunctionDeclaration'
          ]
        }
      ],
      'jsdoc/require-param': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-check': 'warn',
      'jsdoc/check-types': 'error'
    }
  },
  ...pluginVue.configs['flat/strongly-recommended'].map((config) => ({
    ...config,
    files: ['src/**/*.vue']
  })),
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    },
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    files: ['src/**/*.{js,ts,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    plugins: {
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
      'no-duplicate-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'unused-imports/no-unused-imports': 'warn',
      'no-undef': 'error',
      'vue/attribute-hyphenation': 'off',

      'simple-import-sort/imports': [
        'warn',
        {
          groups: [['^node:'], ['^vue', '^@?\\w'], ['^@/'], ['^\\.'], ['^.+\\.?(css|scss)$']]
        }
      ],
      'simple-import-sort/exports': 'warn'
    }
  },
  {
    files: ['src/**/*.{ts,js}'],
    ignores: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/*.stories.ts', 'src/shared/tests/**'],
    plugins: {
      jsdoc
    },
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            ClassDeclaration: true,
            MethodDefinition: true
          },
          contexts: [
            'ExportNamedDeclaration > TSInterfaceDeclaration',
            'ExportNamedDeclaration > TSTypeAliasDeclaration',
            'ExportNamedDeclaration > VariableDeclaration',
            'ExportDefaultDeclaration > VariableDeclaration',
            'ExportDefaultDeclaration > FunctionDeclaration'
          ]
        }
      ],
      'jsdoc/require-param': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/check-types': 'error'
    }
  },
  prettier,
  ...storybook.configs['flat/recommended']
])
