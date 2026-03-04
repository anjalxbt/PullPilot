import { describe, it, expect } from 'vitest';
import { parseConfig, validateConfig, getEnabledRules, DEFAULT_SETTINGS } from '../rules-config';

// ── Fixtures ──────────────────────────────────────────────────
const VALID_YAML = `
version: 1
rules:
  - id: no-large-pr
    name: Large PR
    type: pr-size
    condition:
      max_lines: 500
    severity: warning
    message: PR is too large
  - id: block-env
    name: Block .env
    type: file-pattern
    condition:
      block_files: "**/.env"
    severity: error
    message: Do not commit .env files
`;

const MINIMAL_YAML = `
version: 1
rules: []
`;

// ── parseConfig ───────────────────────────────────────────────
describe('parseConfig', () => {
    it('parses valid YAML into a PullPilotConfig', () => {
        const config = parseConfig(VALID_YAML);
        expect(config.version).toBe(1);
        expect(config.rules).toHaveLength(2);
    });

    it('throws on invalid YAML syntax', () => {
        expect(() => parseConfig('version: : 1 :')).toThrow();
    });

    it('throws when version is missing', () => {
        expect(() => parseConfig('rules: []')).toThrow(/Unsupported config version/);
    });

    it('throws when version is not 1', () => {
        expect(() => parseConfig('version: 2\nrules: []')).toThrow(/Unsupported config version/);
    });

    it('throws when rules array is missing', () => {
        expect(() => parseConfig('version: 1')).toThrow(/rules/i);
    });

    it('merges settings with DEFAULT_SETTINGS', () => {
        const config = parseConfig(MINIMAL_YAML);
        expect(config.settings).toMatchObject(DEFAULT_SETTINGS);
    });

    it('overrides default settings with user-provided values', () => {
        const yaml = `
version: 1
rules: []
settings:
  auto_comment: false
  fail_on_error: true
`;
        const config = parseConfig(yaml);
        expect(config.settings!.auto_comment).toBe(false);
        expect(config.settings!.fail_on_error).toBe(true);
        // Non-overridden setting keeps the default
        expect(config.settings!.ignore_draft_prs).toBe(DEFAULT_SETTINGS.ignore_draft_prs);
    });
});

// ── validateConfig ────────────────────────────────────────────
describe('validateConfig', () => {
    it('returns valid config unchanged', () => {
        const config = validateConfig({
            version: 1,
            rules: [{
                id: 'r1',
                name: 'Rule One',
                type: 'pr-size',
                condition: { max_lines: 200 },
                severity: 'warning',
                message: 'Too big',
            }],
        });
        expect(config.rules[0].id).toBe('r1');
    });

    it('defaults enabled to true when not specified', () => {
        const config = validateConfig({
            version: 1,
            rules: [{
                id: 'r1',
                name: 'Rule',
                type: 'pr-size',
                condition: {},
                severity: 'info',
                message: 'msg',
            }],
        });
        expect(config.rules[0].enabled).toBe(true);
    });

    it('preserves enabled: false', () => {
        const config = validateConfig({
            version: 1,
            rules: [{
                id: 'r1',
                name: 'Rule',
                type: 'pr-size',
                condition: {},
                severity: 'info',
                message: 'msg',
                enabled: false,
            }],
        });
        expect(config.rules[0].enabled).toBe(false);
    });

    it('throws when rule id is missing', () => {
        expect(() => validateConfig({
            version: 1,
            rules: [{ name: 'Bad Rule', type: 'pr-size', condition: {}, severity: 'info', message: 'm' }],
        })).toThrow(/id/);
    });

    it('throws when rule type is invalid', () => {
        expect(() => validateConfig({
            version: 1,
            rules: [{ id: 'r1', name: 'n', type: 'unknown-type', condition: {}, severity: 'info', message: 'm' }],
        })).toThrow(/invalid type/i);
    });

    it('throws when rule severity is invalid', () => {
        expect(() => validateConfig({
            version: 1,
            rules: [{ id: 'r1', name: 'n', type: 'pr-size', condition: {}, severity: 'critical', message: 'm' }],
        })).toThrow(/invalid severity/i);
    });

    it('throws when config is null', () => {
        expect(() => validateConfig(null)).toThrow(/Config must be an object/);
    });

    it('accepts all valid rule types', () => {
        const types = ['pr-size', 'file-pattern', 'content-pattern', 'reviewers'];
        for (const type of types) {
            expect(() => validateConfig({
                version: 1,
                rules: [{ id: 'r', name: 'n', type, condition: {}, severity: 'info', message: 'm' }],
            })).not.toThrow();
        }
    });

    it('accepts all valid severity levels', () => {
        for (const severity of ['error', 'warning', 'info']) {
            expect(() => validateConfig({
                version: 1,
                rules: [{ id: 'r', name: 'n', type: 'pr-size', condition: {}, severity, message: 'm' }],
            })).not.toThrow();
        }
    });
});

// ── getEnabledRules ───────────────────────────────────────────
describe('getEnabledRules', () => {
    it('returns all rules when all are enabled', () => {
        const config = parseConfig(VALID_YAML);
        expect(getEnabledRules(config)).toHaveLength(2);
    });

    it('excludes disabled rules', () => {
        const config = parseConfig(`
version: 1
rules:
  - id: r1
    name: Active
    type: pr-size
    condition: {}
    severity: info
    message: msg
    enabled: true
  - id: r2
    name: Disabled
    type: pr-size
    condition: {}
    severity: info
    message: msg
    enabled: false
`);
        const enabled = getEnabledRules(config);
        expect(enabled).toHaveLength(1);
        expect(enabled[0].id).toBe('r1');
    });

    it('returns empty array when all rules are disabled', () => {
        const config = parseConfig(`
version: 1
rules:
  - id: r1
    name: Disabled Rule
    type: pr-size
    condition: {}
    severity: warning
    message: msg
    enabled: false
`);
        expect(getEnabledRules(config)).toHaveLength(0);
    });
});

// ── DEFAULT_SETTINGS ──────────────────────────────────────────
describe('DEFAULT_SETTINGS', () => {
    it('has expected default values', () => {
        expect(DEFAULT_SETTINGS.auto_comment).toBe(true);
        expect(DEFAULT_SETTINGS.ignore_draft_prs).toBe(false);
        expect(DEFAULT_SETTINGS.fail_on_error).toBe(false);
    });
});
