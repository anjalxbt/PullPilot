import { describe, it, expect } from 'vitest';
import {
    LABEL_PATTERNS,
    SOURCE_CODE_PATTERNS,
    TEST_FILE_PATTERNS,
} from '../label-patterns';
import { FIX_PATTERNS } from '../fix-patterns';

// ── LABEL_PATTERNS – keyword matching ───────────────────────
describe('LABEL_PATTERNS keywords', () => {
    function matchesKeyword(label: string, text: string): boolean {
        const config = LABEL_PATTERNS[label];
        if (!config) throw new Error(`Unknown label: ${label}`);
        return config.keywords.some(p => p.test(text));
    }

    describe('bug', () => {
        it('matches "fix"', () => expect(matchesKeyword('bug', 'fix memory leak')).toBe(true));
        it('matches "fixes"', () => expect(matchesKeyword('bug', 'This fixes the crash')).toBe(true));
        it('matches "hotfix"', () => expect(matchesKeyword('bug', 'hotfix for prod issue')).toBe(true));
        it('matches "broken"', () => expect(matchesKeyword('bug', 'broken endpoint')).toBe(true));
        it('does not match unrelated text', () => expect(matchesKeyword('bug', 'add new feature')).toBe(false));
    });

    describe('feature', () => {
        it('matches "add"', () => expect(matchesKeyword('feature', 'add dark mode')).toBe(true));
        it('matches "implement"', () => expect(matchesKeyword('feature', 'implement OAuth')).toBe(true));
        it('matches "new"', () => expect(matchesKeyword('feature', 'new dashboard component')).toBe(true));
        it('matches "introduce"', () => expect(matchesKeyword('feature', 'introduce caching layer')).toBe(true));
        it('does not match "refactor"', () => expect(matchesKeyword('feature', 'refactor auth module')).toBe(false));
    });

    describe('enhancement', () => {
        it('matches "improve"', () => expect(matchesKeyword('enhancement', 'improve performance')).toBe(true));
        it('matches "refactor"', () => expect(matchesKeyword('enhancement', 'refactor database layer')).toBe(true));
        it('matches "optimize"', () => expect(matchesKeyword('enhancement', 'optimize query')).toBe(true));
        it('matches "cleanup"', () => expect(matchesKeyword('enhancement', 'cleanup old code')).toBe(true));
    });

    describe('documentation', () => {
        it('matches "docs"', () => expect(matchesKeyword('documentation', 'update docs')).toBe(true));
        it('matches "readme"', () => expect(matchesKeyword('documentation', 'update readme')).toBe(true));
        it('matches "changelog"', () => expect(matchesKeyword('documentation', 'add changelog entry')).toBe(true));
    });

    describe('dependencies', () => {
        it('matches "bump"', () => expect(matchesKeyword('dependencies', 'bump lodash to 4.17.21')).toBe(true));
        it('matches "upgrade"', () => expect(matchesKeyword('dependencies', 'upgrade react to 18')).toBe(true));
        it('matches "deps"', () => expect(matchesKeyword('dependencies', 'update deps')).toBe(true));
    });

    describe('breaking-change', () => {
        it('matches "BREAKING"', () => expect(matchesKeyword('breaking-change', 'BREAKING: removed login endpoint')).toBe(true));
        it('matches "breaking"', () => expect(matchesKeyword('breaking-change', 'breaking change in API')).toBe(true));
        it('matches "remove api"', () => expect(matchesKeyword('breaking-change', 'remove the old api export')).toBe(true));
    });

    describe('tests', () => {
        it('matches "test"', () => expect(matchesKeyword('tests', 'add unit test')).toBe(true));
        it('matches "spec"', () => expect(matchesKeyword('tests', 'add spec for auth')).toBe(true));
        it('matches "coverage"', () => expect(matchesKeyword('tests', 'improve coverage')).toBe(true));
    });

    describe('ci', () => {
        it('matches "workflow"', () => expect(matchesKeyword('ci', 'update release workflow')).toBe(true));
        it('matches "github actions"', () => expect(matchesKeyword('ci', 'fix github actions')).toBe(true));
        it('matches "pipeline"', () => expect(matchesKeyword('ci', 'update pipeline config')).toBe(true));
    });
});

// ── LABEL_PATTERNS – file patterns ──────────────────────────
describe('LABEL_PATTERNS file patterns', () => {
    function matchesFile(label: string, filename: string): boolean {
        const config = LABEL_PATTERNS[label];
        return (config.filePatterns ?? []).some(p => p.test(filename));
    }

    it('documentation matches .md files', () => {
        expect(matchesFile('documentation', 'README.md')).toBe(true);
        expect(matchesFile('documentation', 'docs/guide.md')).toBe(true);
    });

    it('documentation does not match .ts files', () => {
        expect(matchesFile('documentation', 'lib/utils.ts')).toBe(false);
    });

    it('dependencies matches package.json', () => {
        expect(matchesFile('dependencies', 'package.json')).toBe(true);
        expect(matchesFile('dependencies', 'yarn.lock')).toBe(true);
        expect(matchesFile('dependencies', 'requirements.txt')).toBe(true);
    });

    it('tests matches test file paths', () => {
        expect(matchesFile('tests', 'lib/__tests__/foo.test.ts')).toBe(true);
        expect(matchesFile('tests', 'src/auth.spec.js')).toBe(true);
        expect(matchesFile('tests', 'tests/integration.ts')).toBe(true);
    });

    it('ci matches workflow directory', () => {
        expect(matchesFile('ci', '.github/workflows/ci.yml')).toBe(true);
        expect(matchesFile('ci', 'Jenkinsfile')).toBe(true);
    });
});

// ── SOURCE_CODE_PATTERNS ─────────────────────────────────────
describe('SOURCE_CODE_PATTERNS', () => {
    function isSource(filename: string): boolean {
        return SOURCE_CODE_PATTERNS.some(p => p.test(filename));
    }

    it('matches src/ files', () => expect(isSource('src/index.ts')).toBe(true));
    it('matches lib/ files', () => expect(isSource('lib/auth.ts')).toBe(true));
    it('matches app/ files', () => expect(isSource('app/page.tsx')).toBe(true));
    it('matches components/ files', () => expect(isSource('components/Button.tsx')).toBe(true));
    it('does not match config files at root', () => expect(isSource('tailwind.config.js')).toBe(false));
    it('does not match test files directly', () => expect(isSource('__tests__/foo.test.ts')).toBe(false));
});

// ── TEST_FILE_PATTERNS ───────────────────────────────────────
describe('TEST_FILE_PATTERNS', () => {
    function isTest(filename: string): boolean {
        return TEST_FILE_PATTERNS.some(p => p.test(filename));
    }

    it('matches .test.ts', () => expect(isTest('auth.test.ts')).toBe(true));
    it('matches .spec.tsx', () => expect(isTest('Button.spec.tsx')).toBe(true));
    it('matches __tests__/ folder', () => expect(isTest('lib/__tests__/scanner.ts')).toBe(true));
    it('does not match regular source files', () => expect(isTest('lib/auth.ts')).toBe(false));
    it('does not match .ts without test suffix', () => expect(isTest('utils.ts')).toBe(false));
});

// ── FIX_PATTERNS ─────────────────────────────────────────────
describe('FIX_PATTERNS', () => {
    function findPattern(category: string) {
        return FIX_PATTERNS.filter(p => p.category === category);
    }

    describe('console_logs', () => {
        const [full, inline] = findPattern('console_logs');

        it('full pattern matches standalone console.log line', () => {
            expect(full.pattern.test('  console.log("hello");')).toBe(true);
        });

        it('full pattern generates remove_line fix', () => {
            const match = '  console.log("hello");'.match(full.pattern)!;
            const fix = full.generateFix(match, '  console.log("hello");');
            expect(fix.type).toBe('remove_line');
            expect(fix.replacement).toBeNull();
        });

        it('inline pattern matches console.log mid-line', () => {
            expect(inline.pattern.test('const x = 1; console.log(x);')).toBe(true);
        });

        it('inline pattern generates replace_line fix removing the call', () => {
            const line = 'const x = 1; console.log(x);';
            const match = line.match(inline.pattern)!;
            const fix = inline.generateFix(match, line);
            expect(fix.type).toBe('replace_line');
            expect(fix.replacement).not.toContain('console.log');
        });

        it('has high confidence (>= 0.9) for full pattern', () => {
            expect(full.confidence).toBeGreaterThanOrEqual(0.9);
        });
    });

    describe('trailing_whitespace', () => {
        const [pattern] = findPattern('trailing_whitespace');

        it('matches lines with trailing spaces', () => {
            expect(pattern.pattern.test('const x = 1;   ')).toBe(true);
        });

        it('does not match clean lines', () => {
            expect(pattern.pattern.test('const x = 1;')).toBe(false);
        });

        it('generates a trimmed replacement', () => {
            const line = 'const x = 1;   ';
            const match = line.match(pattern.pattern)!;
            const fix = pattern.generateFix(match, line);
            expect(fix.type).toBe('replace_line');
            expect(fix.replacement).toBe('const x = 1;');
        });

        it('has very high confidence (>= 0.98)', () => {
            expect(pattern.confidence).toBeGreaterThanOrEqual(0.98);
        });
    });

    describe('unused_imports', () => {
        const [pattern] = findPattern('unused_imports');

        it('matches named import', () => {
            expect(pattern.pattern.test('import { useState } from "react";')).toBe(true);
        });

        it('matches default import', () => {
            expect(pattern.pattern.test("import React from 'react';")).toBe(true);
        });

        it('matches namespace import', () => {
            expect(pattern.pattern.test("import * as path from 'path';")).toBe(true);
        });

        it('generates a remove_line fix', () => {
            const line = 'import { useState } from "react";';
            const match = line.match(pattern.pattern)!;
            const fix = pattern.generateFix(match, line);
            expect(fix.type).toBe('remove_line');
            expect(fix.replacement).toBeNull();
        });
    });

    it('every pattern has at least one supported file extension', () => {
        for (const fp of FIX_PATTERNS) {
            expect(fp.fileExtensions.length).toBeGreaterThan(0);
        }
    });
});
