// eslint.config.mjs
import antfu from '@antfu/eslint-config';
import parser from '@typescript-eslint/parser';

function typescriptPreset() {
    return {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            'ts/naming-convention': [
                'warn',
                // Interfaces' names should start with a capital 'I'.
                {
                    selector: 'interface',
                    format: ['PascalCase'],
                    custom: {
                        regex: '^I[A-Z0-9]',
                        match: true,
                    },
                },
                // Private fields of a class should start with an underscore '_'.
                {
                    selector: ['classMethod', 'classProperty'],
                    modifiers: ['private'],
                    format: ['camelCase'],
                    leadingUnderscore: 'require',
                },
            ],
        },
        languageOptions: {
            parser,
        },
    };
}

export default antfu(
    {
        stylistic: {
            indent: 4,
            semi: true,
        },
        react: false,
        yaml: {
            overrides: {
                'yaml/indent': ['error', 4, { indicatorValueIndent: 2 }],
            },
        },
        markdown: false,
        typescript: true,
        formatters: {
            css: true,
            html: true,
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        ignores: [
            '**/*.tsx',
            '**/*.d.ts',
            '**/vite.config.ts',
            'playwright.config.ts',
            '**/*.spec.ts',
            '**/*.spec.tsx',
            '**/*.test.ts',
            '**/*.test.tsx',
        ], // do not check test files
        rules: {
            'complexity': ['warn', { max: 20 }],
            'max-lines-per-function': ['warn', 200],
        },
    },
    typescriptPreset(),
);
