import { describe, it, expect } from 'vitest';
import {
    SECURITY_RULES,
    getRulesByCategory,
    getRulesBySeverity,
    getSeverityPriority,
} from '../security-rules';

describe('security-rules', () => {
    // ── Helper ────────────────────────────────────────────────
    /** Test a rule's patterns against a string and return whether any match */
    function matchesRule(ruleId: string, input: string): boolean {
        const rule = SECURITY_RULES.find(r => r.id === ruleId);
        if (!rule) throw new Error(`Rule ${ruleId} not found`);
        return rule.patterns.some(p => {
            p.lastIndex = 0; // reset global regex state
            return p.test(input);
        });
    }

    // ── SEC001 – Hardcoded API Key ───────────────────────────
    describe('SEC001 – Hardcoded API Key', () => {
        it('detects OpenAI key pattern', () => {
            expect(matchesRule('SEC001', 'const key = "sk-abc12345678901234567";')).toBe(true);
        });

        // it('detects Stripe live key', () => {
        //     expect(matchesRule('SEC001', 'sk_test_FAKE_KEY_FOR_TESTING')).toBe(true);
        // });

        it('does not flag process.env references', () => {
            // process.env is in the exclude list – but patterns still match the raw string;
            // exclusion logic lives in the scanner, not the regex itself.
            // So this test just verifies the regex does NOT match a clean env reference.
            expect(matchesRule('SEC001', 'const key = process.env.API_KEY;')).toBe(false);
        });
    });

    // ── SEC002 – AWS Credentials ─────────────────────────────
    describe('SEC002 – AWS Credentials', () => {
        it('detects AWS Access Key ID', () => {
            expect(matchesRule('SEC002', 'AKIAIOSFODNN7EXAMPLE')).toBe(true);
        });

        it('does not flag random strings', () => {
            expect(matchesRule('SEC002', 'const name = "hello world";')).toBe(false);
        });
    });

    // ── SEC003 – Private Key ─────────────────────────────────
    describe('SEC003 – Private Key', () => {
        it('detects RSA private key header', () => {
            expect(matchesRule('SEC003', '-----BEGIN RSA PRIVATE KEY-----')).toBe(true);
        });

        it('detects generic private key header', () => {
            expect(matchesRule('SEC003', '-----BEGIN PRIVATE KEY-----')).toBe(true);
        });
    });

    // ── SEC004 – GitHub Token ────────────────────────────────
    describe('SEC004 – GitHub Token', () => {
        it('detects personal access token', () => {
            expect(matchesRule('SEC004', 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij')).toBe(true);
        });

        it('does not flag partial prefix', () => {
            expect(matchesRule('SEC004', 'ghp_short')).toBe(false);
        });
    });

    // ── SEC010 – SQL Injection ───────────────────────────────
    describe('SEC010 – SQL Injection', () => {
        it('detects string concatenation in SQL', () => {
            expect(matchesRule('SEC010', 'SELECT * FROM users WHERE id = " + req.params.id')).toBe(true);
        });

        it('detects template literal in SQL', () => {
            expect(matchesRule('SEC010', '`SELECT * FROM users WHERE id = ${userId}`')).toBe(true);
        });
    });

    // ── SEC031 – Eval Usage ──────────────────────────────────
    describe('SEC031 – Eval Usage', () => {
        it('detects eval()', () => {
            expect(matchesRule('SEC031', 'eval(userInput)')).toBe(true);
        });

        it('detects new Function()', () => {
            expect(matchesRule('SEC031', 'new Function("return " + code)')).toBe(true);
        });
    });

    // ── SEC060 – Weak Hash Algorithm ─────────────────────────
    describe('SEC060 – Weak Hash Algorithm', () => {
        it('detects MD5 hash usage', () => {
            expect(matchesRule('SEC060', 'createHash("md5")')).toBe(true);
        });

        it('does not flag SHA256', () => {
            expect(matchesRule('SEC060', 'createHash("sha256")')).toBe(false);
        });
    });

    // ── Helper functions ─────────────────────────────────────
    describe('getRulesByCategory', () => {
        it('returns only rules of the given category', () => {
            const secrets = getRulesByCategory('secrets');
            expect(secrets.length).toBeGreaterThan(0);
            expect(secrets.every(r => r.category === 'secrets')).toBe(true);
        });
    });

    describe('getRulesBySeverity', () => {
        it('returns only rules of the given severity', () => {
            const critical = getRulesBySeverity('critical');
            expect(critical.length).toBeGreaterThan(0);
            expect(critical.every(r => r.severity === 'critical')).toBe(true);
        });
    });

    describe('getSeverityPriority', () => {
        it('ranks critical < high < medium < low', () => {
            expect(getSeverityPriority('critical')).toBeLessThan(getSeverityPriority('high'));
            expect(getSeverityPriority('high')).toBeLessThan(getSeverityPriority('medium'));
            expect(getSeverityPriority('medium')).toBeLessThan(getSeverityPriority('low'));
        });
    });
});
