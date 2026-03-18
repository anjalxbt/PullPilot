import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['lib/**/*.ts', 'app/api/**/*.ts'],
            exclude: ['**/__tests__/**', '**/*.test.ts', '**/*.d.ts'],
        },
    },
});
