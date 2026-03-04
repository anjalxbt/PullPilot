import { describe, it, expect } from 'vitest';
import { evaluateRules, formatRulesComment, PRContext } from '../rules-engine';
import { PullPilotConfig } from '../rules-config';

// ── Fixtures ──────────────────────────────────────────────────
function makeConfig(rules: PullPilotConfig['rules']): PullPilotConfig {
    return {
        version: 1,
        rules,
        settings: { auto_comment: true, ignore_draft_prs: false, fail_on_error: false },
    };
}

function makeCtx(overrides: Partial<PRContext> = {}): PRContext {
    return {
        additions: 10,
        deletions: 5,
        changedFiles: ['src/index.ts'],
        diff: '',
        reviewerCount: 1,
        hasCodeownersApproval: true,
        isDraft: false,
        ...overrides,
    };
}

const BASE_RULE = {
    id: 'r1',
    name: 'Test Rule',
    severity: 'warning' as const,
    message: 'Violation message',
    enabled: true,
};

// ── evaluateRules – pr-size ───────────────────────────────────
describe('evaluateRules – pr-size', () => {
    it('passes when PR is within limits', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'pr-size',
            condition: { max_lines: 1000 },
        }]);
        const result = evaluateRules(config, makeCtx({ additions: 100, deletions: 50 }));
        expect(result.violations).toHaveLength(0);
        expect(result.hasErrors).toBe(false);
    });

    it('violates when total lines exceed max_lines', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'pr-size',
            condition: { max_lines: 10 },
        }]);
        const result = evaluateRules(config, makeCtx({ additions: 8, deletions: 5 }));
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].details).toContain('13 lines changed');
    });

    it('violates when additions exceed max_additions', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'pr-size',
            condition: { max_additions: 5 },
        }]);
        const result = evaluateRules(config, makeCtx({ additions: 100 }));
        expect(result.violations[0].details).toContain('100 additions');
    });

    it('violates when deletions exceed max_deletions', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'pr-size',
            condition: { max_deletions: 2 },
        }]);
        const result = evaluateRules(config, makeCtx({ deletions: 50 }));
        expect(result.violations[0].details).toContain('50 deletions');
    });

    it('violates when changed files exceed max_files', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'pr-size',
            condition: { max_files: 1 },
        }]);
        const result = evaluateRules(config, makeCtx({
            changedFiles: ['a.ts', 'b.ts', 'c.ts'],
        }));
        expect(result.violations[0].details).toContain('3 files changed');
    });
});

// ── evaluateRules – file-pattern ──────────────────────────────
describe('evaluateRules – file-pattern', () => {
    it('blocks a forbidden file', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'file-pattern',
            condition: { block_files: '.env' },
        }]);
        const result = evaluateRules(config, makeCtx({ changedFiles: ['.env', 'src/app.ts'] }));
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].details).toContain('.env');
    });

    it('passes when blocked file is not changed', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'file-pattern',
            condition: { block_files: '.env' },
        }]);
        const result = evaluateRules(config, makeCtx({ changedFiles: ['src/app.ts'] }));
        expect(result.violations).toHaveLength(0);
    });

    it('violates when changed_files pattern matches but required file is missing', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'file-pattern',
            condition: { changed_files: '*.sql', require_files: 'CHANGELOG.md' },
        }]);
        const result = evaluateRules(config, makeCtx({ changedFiles: ['migration.sql'] }));
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].details).toContain('CHANGELOG.md');
    });

    it('passes when changed_files pattern matches and required file is present', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'file-pattern',
            condition: { changed_files: '*.sql', require_files: 'CHANGELOG.md' },
        }]);
        const result = evaluateRules(config, makeCtx({
            changedFiles: ['migration.sql', 'CHANGELOG.md'],
        }));
        expect(result.violations).toHaveLength(0);
    });
});

// ── evaluateRules – content-pattern ──────────────────────────
describe('evaluateRules – content-pattern', () => {
    it('flags a forbidden pattern found in the diff', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'content-pattern',
            condition: { pattern: 'TODO' },
        }]);
        const result = evaluateRules(config, makeCtx({ diff: '+  // TODO: fix this later' }));
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].details).toContain('1 occurrence');
    });

    it('passes when pattern is not found', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'content-pattern',
            condition: { pattern: 'FIXME' },
        }]);
        const result = evaluateRules(config, makeCtx({ diff: '+  const x = 1;' }));
        expect(result.violations).toHaveLength(0);
    });

    it('filters by file_extensions and skips if no relevant files', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'content-pattern',
            condition: { pattern: 'TODO', file_extensions: ['.py'] },
        }]);
        // Only .ts files changed — rule should not apply
        const result = evaluateRules(config, makeCtx({
            changedFiles: ['src/index.ts'],
            diff: '+  // TODO: fix this',
        }));
        expect(result.violations).toHaveLength(0);
    });

    it('does not crash on invalid regex — returns no violation', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'content-pattern',
            condition: { pattern: '[invalid regex(' },
        }]);
        const result = evaluateRules(config, makeCtx({ diff: 'some code' }));
        expect(result.violations).toHaveLength(0);
    });
});

// ── evaluateRules – reviewers ─────────────────────────────────
describe('evaluateRules – reviewers', () => {
    it('violates when reviewer count is below minimum', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            severity: 'error',
            type: 'reviewers',
            condition: { min_reviewers: 2 },
        }]);
        const result = evaluateRules(config, makeCtx({ reviewerCount: 1 }));
        expect(result.violations).toHaveLength(1);
        expect(result.hasErrors).toBe(true);
        expect(result.violations[0].details).toContain('1 reviewers');
    });

    it('passes when reviewer count meets minimum', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'reviewers',
            condition: { min_reviewers: 2 },
        }]);
        const result = evaluateRules(config, makeCtx({ reviewerCount: 3 }));
        expect(result.violations).toHaveLength(0);
    });

    it('violates when CODEOWNERS approval is required but missing', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'reviewers',
            condition: { require_codeowners: true },
        }]);
        const result = evaluateRules(config, makeCtx({ hasCodeownersApproval: false }));
        expect(result.violations).toHaveLength(1);
        expect(result.violations[0].details).toContain('CODEOWNERS');
    });

    it('passes when CODEOWNERS approval is present', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'reviewers',
            condition: { require_codeowners: true },
        }]);
        const result = evaluateRules(config, makeCtx({ hasCodeownersApproval: true }));
        expect(result.violations).toHaveLength(0);
    });
});

// ── evaluateRules – summary counts ───────────────────────────
describe('evaluateRules – summary', () => {
    it('correctly counts errors, warnings, and info', () => {
        const config = makeConfig([
            { ...BASE_RULE, id: 'r1', severity: 'error', type: 'pr-size', condition: { max_lines: 1 }, message: 'm' },
            { ...BASE_RULE, id: 'r2', severity: 'warning', type: 'pr-size', condition: { max_lines: 1 }, message: 'm' },
            { ...BASE_RULE, id: 'r3', severity: 'info', type: 'pr-size', condition: { max_lines: 1 }, message: 'm' },
        ]);
        const result = evaluateRules(config, makeCtx({ additions: 50, deletions: 50 }));
        expect(result.summary.errors).toBe(1);
        expect(result.summary.warnings).toBe(1);
        expect(result.summary.info).toBe(1);
        expect(result.summary.total).toBe(3);
    });

    it('skips disabled rules', () => {
        const config = makeConfig([{
            ...BASE_RULE,
            type: 'pr-size',
            condition: { max_lines: 1 },
            enabled: false,
        }]);
        const result = evaluateRules(config, makeCtx({ additions: 500 }));
        expect(result.violations).toHaveLength(0);
    });
});

// ── formatRulesComment ────────────────────────────────────────
describe('formatRulesComment', () => {
    it('returns empty string when no violations', () => {
        const result = { violations: [], hasErrors: false, hasWarnings: false, summary: { total: 0, errors: 0, warnings: 0, info: 0 } };
        expect(formatRulesComment(result)).toBe('');
    });

    it('includes error section for error violations', () => {
        const result = {
            violations: [{ ruleId: 'r1', ruleName: 'Big PR', severity: 'error' as const, message: 'Too large', details: '600 lines changed' }],
            hasErrors: true,
            hasWarnings: false,
            summary: { total: 1, errors: 1, warnings: 0, info: 0 },
        };
        const comment = formatRulesComment(result);
        expect(comment).toContain('❌ Errors');
        expect(comment).toContain('Big PR');
        expect(comment).toContain('600 lines changed');
    });

    it('includes warning section for warning violations', () => {
        const result = {
            violations: [{ ruleId: 'r2', ruleName: 'Lint rule', severity: 'warning' as const, message: 'Linting issue' }],
            hasErrors: false,
            hasWarnings: true,
            summary: { total: 1, errors: 0, warnings: 1, info: 0 },
        };
        const comment = formatRulesComment(result);
        expect(comment).toContain('⚠️ Warnings');
        expect(comment).toContain('Lint rule');
    });

    it('mentions pullpilot.yml attribution', () => {
        const result = {
            violations: [{ ruleId: 'r1', ruleName: 'R', severity: 'info' as const, message: 'msg' }],
            hasErrors: false,
            hasWarnings: false,
            summary: { total: 1, errors: 0, warnings: 0, info: 1 },
        };
        expect(formatRulesComment(result)).toContain('.pullpilot.yml');
    });
});
