import { describe, it, expect } from 'vitest';
import {
    detectLabels,
    detectMissingTests,
    getLabelColor,
    formatLabelComment,
    LabelSuggestion,
} from '../auto-labeler';

// ── Helpers ──────────────────────────────────────────────────
function makeFile(filename: string, status = 'modified') {
    return { filename, status, additions: 10, deletions: 0, changes: 10 };
}

// ── detectLabels ─────────────────────────────────────────────
describe('detectLabels', () => {
    it('suggests "bug" label when title contains "fix"', () => {
        const suggestions = detectLabels('fix null pointer crash', '', [], '');
        expect(suggestions.some(s => s.label === 'bug')).toBe(true);
    });

    it('suggests "feature" label when title contains "add"', () => {
        const suggestions = detectLabels('add dark mode support', '', [], '');
        expect(suggestions.some(s => s.label === 'feature')).toBe(true);
    });

    it('suggests "enhancement" label when title contains "refactor"', () => {
        const suggestions = detectLabels('refactor auth module', '', [], '');
        expect(suggestions.some(s => s.label === 'enhancement')).toBe(true);
    });

    it('suggests "documentation" label for .md file changes', () => {
        const suggestions = detectLabels('', '', [makeFile('README.md')], '');
        expect(suggestions.some(s => s.label === 'documentation')).toBe(true);
    });

    it('suggests "dependencies" label for package.json change', () => {
        const suggestions = detectLabels('', '', [makeFile('package.json')], '');
        expect(suggestions.some(s => s.label === 'dependencies')).toBe(true);
    });

    it('suggests "tests" label for .test.ts file changes', () => {
        const suggestions = detectLabels('', '', [makeFile('auth.test.ts')], '');
        expect(suggestions.some(s => s.label === 'tests')).toBe(true);
    });

    it('suggests "ci" label for GitHub Actions workflow change', () => {
        const suggestions = detectLabels('', '', [makeFile('.github/workflows/ci.yml')], '');
        expect(suggestions.some(s => s.label === 'ci')).toBe(true);
    });

    it('only returns suggestions above 0.5 confidence', () => {
        const suggestions = detectLabels('', '', [], '');
        for (const s of suggestions) {
            expect(s.confidence).toBeGreaterThan(0.5);
        }
    });

    it('returns suggestions sorted by confidence (highest first)', () => {
        const suggestions = detectLabels('fix crash in login', 'This fixes the broken login', [], '');
        for (let i = 1; i < suggestions.length; i++) {
            expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence);
        }
    });

    it('returns no duplicate labels', () => {
        const suggestions = detectLabels('fix all the bugs and fixes', '', [], '');
        const labels = suggestions.map(s => s.label);
        expect(new Set(labels).size).toBe(labels.length);
    });

    it('gives higher confidence to title matches than body matches', () => {
        const titleMatch = detectLabels('fix login bug', '', [], '');
        const bodyMatch = detectLabels('', 'fix login bug', [], '');
        const bugTitle = titleMatch.find(s => s.label === 'bug')?.confidence ?? 0;
        const bugBody = bodyMatch.find(s => s.label === 'bug')?.confidence ?? 0;
        expect(bugTitle).toBeGreaterThan(bugBody);
    });

    it('suggests "needs-tests" when new source file is added without tests', () => {
        const suggestions = detectLabels('', '', [
            { filename: 'src/auth.ts', status: 'added', additions: 50, deletions: 0, changes: 50 },
        ], '');
        expect(suggestions.some(s => s.label === 'needs-tests')).toBe(true);
    });

    it('does not suggest "needs-tests" when test file accompanies source file', () => {
        const suggestions = detectLabels('', '', [
            { filename: 'src/auth.ts', status: 'added', additions: 50, deletions: 0, changes: 50 },
            { filename: 'src/auth.test.ts', status: 'added', additions: 30, deletions: 0, changes: 30 },
        ], '');
        expect(suggestions.some(s => s.label === 'needs-tests')).toBe(false);
    });
});

// ── detectMissingTests ────────────────────────────────────────
describe('detectMissingTests', () => {
    it('returns true when new src file has no accompanying tests', () => {
        const files = [
            { filename: 'src/utils.ts', status: 'added', additions: 20, deletions: 0, changes: 20 },
        ];
        expect(detectMissingTests(files)).toBe(true);
    });

    it('returns false when new src file has a matching test file', () => {
        const files = [
            { filename: 'src/utils.ts', status: 'added', additions: 20, deletions: 0, changes: 20 },
            { filename: 'src/__tests__/utils.test.ts', status: 'added', additions: 15, deletions: 0, changes: 15 },
        ];
        expect(detectMissingTests(files)).toBe(false);
    });

    it('returns false when only existing files are modified (not added)', () => {
        const files = [
            { filename: 'src/utils.ts', status: 'modified', additions: 5, deletions: 2, changes: 7 },
        ];
        expect(detectMissingTests(files)).toBe(false);
    });

    it('returns false when there are no files at all', () => {
        expect(detectMissingTests([])).toBe(false);
    });

    it('returns false for non-source paths (e.g. config files)', () => {
        const files = [
            { filename: 'tailwind.config.js', status: 'added', additions: 5, deletions: 0, changes: 5 },
        ];
        expect(detectMissingTests(files)).toBe(false);
    });
});

// ── getLabelColor ─────────────────────────────────────────────
describe('getLabelColor', () => {
    it('returns red for "bug"', () => {
        expect(getLabelColor('bug')).toBe('d73a4a');
    });

    it('returns a fallback color for unknown labels', () => {
        expect(getLabelColor('unknown-label')).toBe('ededed');
    });

    it('returns unique colors for bug, feature, and enhancement', () => {
        const colors = ['bug', 'feature', 'enhancement'].map(getLabelColor);
        expect(new Set(colors).size).toBe(3);
    });
});

// ── formatLabelComment ────────────────────────────────────────
describe('formatLabelComment', () => {
    it('returns empty string when no suggestions', () => {
        expect(formatLabelComment([])).toBe('');
    });

    it('includes auto-label header', () => {
        const suggestions: LabelSuggestion[] = [
            { label: 'bug', confidence: 0.9, reason: 'Title matches fix' },
        ];
        expect(formatLabelComment(suggestions)).toContain('🏷️ Auto-Labels');
    });

    it('shows applied labels for high-confidence (>= 0.7) suggestions', () => {
        const suggestions: LabelSuggestion[] = [
            { label: 'bug', confidence: 0.85, reason: 'Title match' },
            { label: 'feature', confidence: 0.5, reason: 'Body match' },
        ];
        const comment = formatLabelComment(suggestions);
        expect(comment).toContain('Applied:');
        expect(comment).toContain('`bug`');
        // Low confidence label should appear in table but not in Applied line
        expect(comment).toContain('`feature`');
    });

    it('shows at most 5 suggestions in the table', () => {
        const suggestions: LabelSuggestion[] = Array.from({ length: 8 }, (_, i) => ({
            label: `label-${i}`,
            confidence: 0.9,
            reason: 'match',
        }));
        const comment = formatLabelComment(suggestions);
        // Count table rows (each starts with "| `label-")
        const rowCount = (comment.match(/\| `label-/g) ?? []).length;
        expect(rowCount).toBeLessThanOrEqual(5);
    });

    it('displays confidence as a percentage', () => {
        const suggestions: LabelSuggestion[] = [
            { label: 'bug', confidence: 0.75, reason: 'match' },
        ];
        expect(formatLabelComment(suggestions)).toContain('75%');
    });
});
