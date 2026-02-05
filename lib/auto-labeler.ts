/**
 * Smart Auto-Labeler for Pull Requests
 * 
 * Automatically detects and suggests labels based on PR content analysis.
 */

import {
    LABEL_PATTERNS,
    SOURCE_CODE_PATTERNS,
    TEST_FILE_PATTERNS,
} from './patterns';

export interface LabelSuggestion {
    label: string;
    confidence: number;  // 0-1
    reason: string;
}

interface PRFile {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
}

/**
 * Detect labels based on PR content
 */
export function detectLabels(
    prTitle: string,
    prBody: string,
    files: PRFile[],
    diff: string
): LabelSuggestion[] {
    const suggestions: LabelSuggestion[] = [];
    const text = `${prTitle} ${prBody}`.toLowerCase();
    const filenames = files.map(f => f.filename);

    for (const [label, config] of Object.entries(LABEL_PATTERNS)) {
        let confidence = 0;
        let matchCount = 0;
        const reasons: string[] = [];

        // Check keywords in title/body
        for (const pattern of config.keywords) {
            if (pattern.test(prTitle)) {
                matchCount += 2;  // Title matches are worth more
                reasons.push(`Title matches "${pattern.source}"`);
            }
            if (pattern.test(prBody)) {
                matchCount += 1;
                reasons.push(`Description matches pattern`);
            }
        }

        // Check file patterns
        if (config.filePatterns) {
            const matchingFiles = filenames.filter(f =>
                config.filePatterns!.some(p => p.test(f))
            );
            if (matchingFiles.length > 0) {
                matchCount += matchingFiles.length;
                reasons.push(`${matchingFiles.length} matching file(s)`);
            }

            // For documentation/dependencies: if ALL files match, high confidence
            if (matchingFiles.length === filenames.length && filenames.length > 0) {
                confidence = 0.9;
            }
        }

        // Calculate confidence
        if (matchCount > 0 && confidence === 0) {
            confidence = Math.min(0.5 + (matchCount * 0.15), 0.95);
        }

        if (confidence > 0.5) {
            suggestions.push({
                label,
                confidence,
                reason: reasons.slice(0, 2).join('; ') || config.description,
            });
        }
    }

    // Check for missing tests
    const needsTests = detectMissingTests(files);
    if (needsTests) {
        suggestions.push({
            label: 'needs-tests',
            confidence: 0.85,
            reason: 'New source code without corresponding test files',
        });
    }

    // Sort by confidence (highest first)
    suggestions.sort((a, b) => b.confidence - a.confidence);

    // Remove duplicates (keep highest confidence)
    const seen = new Set<string>();
    return suggestions.filter(s => {
        if (seen.has(s.label)) return false;
        seen.add(s.label);
        return true;
    });
}

/**
 * Detect if new source code is missing tests
 */
export function detectMissingTests(files: PRFile[]): boolean {
    const newSourceFiles: string[] = [];
    const testFiles: string[] = [];

    for (const file of files) {
        // Only check added files
        if (file.status !== 'added') continue;

        const isSourceCode = SOURCE_CODE_PATTERNS.some(p => p.test(file.filename));
        const isTestFile = TEST_FILE_PATTERNS.some(p => p.test(file.filename));

        if (isTestFile) {
            testFiles.push(file.filename);
        } else if (isSourceCode && /\.(ts|tsx|js|jsx|py|rb|go|rs)$/.test(file.filename)) {
            newSourceFiles.push(file.filename);
        }
    }

    // If there are new source files but no test files, suggest needs-tests
    if (newSourceFiles.length > 0 && testFiles.length === 0) {
        // Check if any of the new source files have corresponding tests
        const hasMatchingTests = newSourceFiles.some(srcFile => {
            const baseName = srcFile.replace(/\.(ts|tsx|js|jsx|py|rb|go|rs)$/, '');
            return testFiles.some(testFile =>
                testFile.includes(baseName.split('/').pop() || '')
            );
        });

        return !hasMatchingTests;
    }

    return false;
}

/**
 * Get color for label (for creating new labels)
 */
export function getLabelColor(label: string): string {
    const colors: Record<string, string> = {
        'bug': 'd73a4a',           // Red
        'feature': 'a2eeef',       // Cyan
        'enhancement': '7057ff',   // Purple
        'documentation': '0075ca', // Blue
        'dependencies': '0366d6',  // Dark blue
        'breaking-change': 'b60205', // Dark red
        'needs-tests': 'fbca04',   // Yellow
        'tests': '0e8a16',         // Green
        'ci': 'e4e669',            // Light yellow
    };
    return colors[label] || 'ededed';  // Default gray
}

/**
 * Format label suggestions for PR comment
 */
export function formatLabelComment(suggestions: LabelSuggestion[]): string {
    if (suggestions.length === 0) {
        return '';
    }

    const highConfidence = suggestions.filter(s => s.confidence >= 0.7);
    const applied = highConfidence.map(s => `\`${s.label}\``).join(', ');

    let comment = `## 🏷️ Auto-Labels\n\n`;

    if (highConfidence.length > 0) {
        comment += `Applied: ${applied}\n\n`;
    }

    comment += `| Label | Confidence | Reason |\n`;
    comment += `|-------|------------|--------|\n`;

    for (const s of suggestions.slice(0, 5)) {
        const confidenceStr = `${Math.round(s.confidence * 100)}%`;
        const appliedStr = s.confidence >= 0.7 ? ' ✓' : '';
        comment += `| \`${s.label}\`${appliedStr} | ${confidenceStr} | ${s.reason} |\n`;
    }

    return comment;
}
