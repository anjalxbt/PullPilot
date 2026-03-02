import { describe, it, expect } from 'vitest';
import {
    scanForSecurityIssues,
    formatSecurityComment,
    hasBlockingIssues,
    formatInlineSecurityBody,
    formatSecuritySummaryLine,
} from '../security-scanner';

// ── Helpers ──────────────────────────────────────────────────
/** Build a minimal unified diff for a single file */
function makeDiff(filename: string, addedLines: string[]): string {
    const plus = addedLines.map(l => `+${l}`).join('\n');
    return [
        `diff --git a/${filename} b/${filename}`,
        `--- a/${filename}`,
        `+++ b/${filename}`,
        `@@ -1,0 +1,${addedLines.length} @@`,
        plus,
    ].join('\n');
}

function makeFiles(filename: string) {
    return [{ filename, status: 'modified', additions: 1, deletions: 0, changes: 1 }];
}

// ── scanForSecurityIssues ────────────────────────────────────
describe('scanForSecurityIssues', () => {
    it('detects a hardcoded OpenAI key in a .ts file', () => {
        const diff = makeDiff('src/config.ts', [
            'const apiKey = "sk-proj1234567890abcdefgh";',
        ]);
        const result = scanForSecurityIssues(diff, makeFiles('src/config.ts'));

        expect(result.findings.length).toBeGreaterThan(0);
        expect(result.findings.some(f => f.ruleId === 'SEC001')).toBe(true);
        expect(result.summary.critical).toBeGreaterThan(0);
    });

    it('detects eval() usage', () => {
        const diff = makeDiff('lib/utils.ts', [
            'const run = eval(userInput);',
        ]);
        const result = scanForSecurityIssues(diff, makeFiles('lib/utils.ts'));

        expect(result.findings.some(f => f.ruleId === 'SEC031')).toBe(true);
        expect(result.findings.find(f => f.ruleId === 'SEC031')?.severity).toBe('critical');
    });

    it('detects SQL injection via template literal', () => {
        const diff = makeDiff('api/users.ts', [
            'const q = `SELECT * FROM users WHERE id = ${req.params.id}`;',
        ]);
        const result = scanForSecurityIssues(diff, makeFiles('api/users.ts'));

        expect(result.findings.some(f => f.ruleId === 'SEC010')).toBe(true);
    });

    it('detects AWS access key', () => {
        const diff = makeDiff('deploy.ts', [
            'const key = "AKIAIOSFODNN7EXAMPLE";',
        ]);
        const result = scanForSecurityIssues(diff, makeFiles('deploy.ts'));

        expect(result.findings.some(f => f.ruleId === 'SEC002')).toBe(true);
    });

    it('detects private key header', () => {
        const diff = makeDiff('certs/key.pem', [
            '-----BEGIN RSA PRIVATE KEY-----',
            'MIIBogIBAAJBALx...',
            '-----END RSA PRIVATE KEY-----',
        ]);
        const result = scanForSecurityIssues(diff, makeFiles('certs/key.pem'));

        expect(result.findings.some(f => f.ruleId === 'SEC003')).toBe(true);
    });

    it('returns clean result for safe code', () => {
        const diff = makeDiff('lib/math.ts', [
            'export function add(a: number, b: number): number {',
            '    return a + b;',
            '}',
        ]);
        const result = scanForSecurityIssues(diff, makeFiles('lib/math.ts'));

        expect(result.findings).toHaveLength(0);
        expect(result.summary.total).toBe(0);
    });

    it('correctly counts scannedFiles', () => {
        const diff = [
            makeDiff('a.ts', ['const x = 1;']),
            makeDiff('b.ts', ['const y = 2;']),
        ].join('\n');

        const result = scanForSecurityIssues(diff, []);
        expect(result.scannedFiles).toBe(2);
    });

    it('maps line numbers to actual diff positions', () => {
        const diff = makeDiff('app.ts', [
            'const safe = true;',
            'eval("danger");',
        ]);
        const result = scanForSecurityIssues(diff, makeFiles('app.ts'));

        const evalFinding = result.findings.find(f => f.ruleId === 'SEC031');
        expect(evalFinding).toBeDefined();
        // eval is on the 2nd added line → actual line 2 in the new file
        expect(evalFinding!.line).toBe(2);
    });

    it('sorts findings by severity (critical first)', () => {
        const diff = makeDiff('mixed.ts', [
            'eval(input);',                        // SEC031 critical
            'document.write(x);',                  // SEC022 medium
        ]);
        const result = scanForSecurityIssues(diff, makeFiles('mixed.ts'));

        if (result.findings.length >= 2) {
            const severityOrder = ['critical', 'high', 'medium', 'low'];
            for (let i = 1; i < result.findings.length; i++) {
                const prev = severityOrder.indexOf(result.findings[i - 1].severity);
                const curr = severityOrder.indexOf(result.findings[i].severity);
                expect(prev).toBeLessThanOrEqual(curr);
            }
        }
    });
});

// ── formatSecurityComment ────────────────────────────────────
describe('formatSecurityComment', () => {
    it('returns clean message when no findings', () => {
        const result = {
            findings: [],
            summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
            scannedFiles: 3,
            scanTime: 12,
        };
        const comment = formatSecurityComment(result);

        expect(comment).toContain('No security issues detected');
        expect(comment).toContain('3 file(s)');
    });

    it('includes severity badges for findings', () => {
        const result = {
            findings: [{
                ruleId: 'SEC001',
                ruleName: 'Hardcoded API Key',
                severity: 'critical' as const,
                category: 'secrets' as const,
                message: 'Detected hardcoded API key',
                file: 'config.ts',
                line: 5,
                snippet: 'const key = "sk-abc123...";',
            }],
            summary: { critical: 1, high: 0, medium: 0, low: 0, total: 1 },
            scannedFiles: 1,
            scanTime: 5,
        };
        const comment = formatSecurityComment(result);

        expect(comment).toContain('1 Critical');
        expect(comment).toContain('SEC001');
        expect(comment).toContain('config.ts');
    });
});

// ── hasBlockingIssues ────────────────────────────────────────
describe('hasBlockingIssues', () => {
    it('returns true when critical issues exist', () => {
        const result = {
            findings: [],
            summary: { critical: 1, high: 0, medium: 0, low: 0, total: 1 },
            scannedFiles: 1,
            scanTime: 1,
        };
        expect(hasBlockingIssues(result)).toBe(true);
    });

    it('returns true when high issues exist', () => {
        const result = {
            findings: [],
            summary: { critical: 0, high: 2, medium: 0, low: 0, total: 2 },
            scannedFiles: 1,
            scanTime: 1,
        };
        expect(hasBlockingIssues(result)).toBe(true);
    });

    it('returns false when only medium/low issues exist', () => {
        const result = {
            findings: [],
            summary: { critical: 0, high: 0, medium: 3, low: 1, total: 4 },
            scannedFiles: 1,
            scanTime: 1,
        };
        expect(hasBlockingIssues(result)).toBe(false);
    });
});

// ── formatInlineSecurityBody ─────────────────────────────────
describe('formatInlineSecurityBody', () => {
    it('formats a finding with severity emoji and snippet', () => {
        const body = formatInlineSecurityBody({
            ruleId: 'SEC031',
            ruleName: 'Eval Usage',
            severity: 'critical',
            category: 'command-injection',
            message: 'eval() is dangerous',
            file: 'app.ts',
            line: 10,
            snippet: 'eval(userInput)',
        });

        expect(body).toContain('🔴');
        expect(body).toContain('CRITICAL');
        expect(body).toContain('SEC031');
        expect(body).toContain('eval(userInput)');
    });
});

// ── formatSecuritySummaryLine ────────────────────────────────
describe('formatSecuritySummaryLine', () => {
    it('returns clean summary when no findings', () => {
        const result = {
            findings: [],
            summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
            scannedFiles: 2,
            scanTime: 8,
        };
        const line = formatSecuritySummaryLine(result);

        expect(line).toContain('No security issues detected');
    });

    it('includes total count and severity breakdown', () => {
        const result = {
            findings: [{ ruleId: 'X', ruleName: '', severity: 'high' as const, category: 'xss' as const, message: '', file: '' }],
            summary: { critical: 0, high: 1, medium: 2, low: 0, total: 3 },
            scannedFiles: 5,
            scanTime: 15,
        };
        const line = formatSecuritySummaryLine(result);

        expect(line).toContain('1 High');
        expect(line).toContain('2 Medium');
        expect(line).toContain('3 issue(s) found');
    });
});
