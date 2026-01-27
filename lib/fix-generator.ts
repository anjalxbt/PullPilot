/**
 * Fix Suggestion Generator
 * 
 * Generates automated fix suggestions for common code issues.
 * Fixes are applied only when user clicks "Apply Fix" in PR comments.
 */

import { v4 as uuidv4 } from 'uuid';

// ========== TYPES ==========

export type FixType = 'remove_line' | 'replace_line' | 'insert_line';

export interface FixSuggestion {
    id: string;
    type: FixType;
    file: string;
    line: number;
    original: string;
    replacement: string | null;
    description: string;
    confidence: number;  // 0-1
    category: string;    // e.g., 'console_log', 'unused_import'
}

export interface PRFile {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
}

export interface AutoFixConfig {
    enabled: boolean;
    types: {
        console_logs: boolean;
        unused_imports: boolean;
        trailing_whitespace: boolean;
        missing_semicolons: boolean;
    };
    min_confidence: number;
}

// Default configuration (auto-fix is ON by default)
export const DEFAULT_AUTOFIX_CONFIG: AutoFixConfig = {
    enabled: true,
    types: {
        console_logs: true,
        unused_imports: true,
        trailing_whitespace: true,
        missing_semicolons: false,
    },
    min_confidence: 0.8,
};

// ========== FIX PATTERNS ==========

interface FixPattern {
    category: string;
    pattern: RegExp;
    description: string;
    confidence: number;
    generateFix: (match: RegExpMatchArray, line: string) => {
        type: FixType;
        replacement: string | null;
    };
    fileExtensions: string[];
}

const FIX_PATTERNS: FixPattern[] = [
    // Console.log statements
    {
        category: 'console_logs',
        pattern: /^\s*console\.(log|debug|info|warn|error)\s*\([^)]*\)\s*;?\s*$/,
        description: 'Remove console statement',
        confidence: 0.95,
        generateFix: () => ({
            type: 'remove_line',
            replacement: null,
        }),
        fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
    },
    // Console.log in middle of line (less confident)
    {
        category: 'console_logs',
        pattern: /console\.(log|debug|info)\s*\([^)]*\)\s*;?/,
        description: 'Remove console.log call',
        confidence: 0.7,
        generateFix: (match, line) => ({
            type: 'replace_line',
            replacement: line.replace(match[0], '').trim() || null,
        }),
        fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
    },
    // Unused imports (TypeScript/JavaScript)
    {
        category: 'unused_imports',
        pattern: /^import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"][^'"]+['"]\s*;?\s*$/,
        description: 'Remove unused import',
        confidence: 0.85,
        generateFix: () => ({
            type: 'remove_line',
            replacement: null,
        }),
        fileExtensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    // Trailing whitespace
    {
        category: 'trailing_whitespace',
        pattern: /\s+$/,
        description: 'Remove trailing whitespace',
        confidence: 0.99,
        generateFix: (_match, line) => ({
            type: 'replace_line',
            replacement: line.trimEnd(),
        }),
        fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.css', '.scss', '.html'],
    },
];

// ========== MAIN FUNCTIONS ==========

/**
 * Generate fix suggestions for a PR diff
 */
export function generateFixSuggestions(
    diff: string,
    files: PRFile[],
    config: Partial<AutoFixConfig> = {}
): FixSuggestion[] {
    // Merge with defaults
    const mergedConfig: AutoFixConfig = {
        ...DEFAULT_AUTOFIX_CONFIG,
        ...config,
        types: {
            ...DEFAULT_AUTOFIX_CONFIG.types,
            ...(config.types || {}),
        },
    };

    // If auto-fix is disabled, return empty
    if (!mergedConfig.enabled) {
        return [];
    }

    const suggestions: FixSuggestion[] = [];
    const parsedDiff = parseDiffForFixes(diff);

    for (const [filename, fileContent] of Object.entries(parsedDiff)) {
        const fileExt = getFileExtension(filename);
        const lines = fileContent.addedLines;

        for (const { lineNumber, content } of lines) {
            // Check each pattern
            for (const pattern of FIX_PATTERNS) {
                // Skip if category is disabled
                const categoryKey = pattern.category as keyof typeof mergedConfig.types;
                if (!mergedConfig.types[categoryKey]) {
                    continue;
                }

                // Skip if file extension doesn't match
                if (!pattern.fileExtensions.includes(fileExt)) {
                    continue;
                }

                // Skip if below confidence threshold
                if (pattern.confidence < mergedConfig.min_confidence) {
                    continue;
                }

                // Check if pattern matches
                const match = content.match(pattern.pattern);
                if (match) {
                    const fix = pattern.generateFix(match, content);

                    // Only add if fix makes sense
                    if (fix.type === 'remove_line' || (fix.type === 'replace_line' && fix.replacement !== content)) {
                        suggestions.push({
                            id: uuidv4(),
                            type: fix.type,
                            file: filename,
                            line: lineNumber,
                            original: content,
                            replacement: fix.replacement,
                            description: pattern.description,
                            confidence: pattern.confidence,
                            category: pattern.category,
                        });
                    }
                }
            }
        }
    }

    // Deduplicate (same file + line)
    return deduplicateSuggestions(suggestions);
}

/**
 * Parse diff to extract added lines with line numbers
 */
function parseDiffForFixes(diff: string): Record<string, {
    addedLines: Array<{ lineNumber: number; content: string }>;
}> {
    const result: Record<string, { addedLines: Array<{ lineNumber: number; content: string }> }> = {};

    const fileDiffs = diff.split(/^diff --git/m).filter(Boolean);

    for (const fileDiff of fileDiffs) {
        // Extract filename from git diff format: a/path/to/file b/path/to/file
        const filenameMatch = fileDiff.match(/^\s*a\/(.+?)\s+b\/(.+)/m);
        if (!filenameMatch) continue;

        // Use the 'b' (new file) path, and remove any leading slash
        let filename = filenameMatch[2].trim();
        // Handle potential edge cases with file paths
        filename = filename.replace(/^\/+/, ''); // Remove leading slashes

        result[filename] = { addedLines: [] };

        // Parse hunks
        const hunkPattern = /@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/g;
        const lines = fileDiff.split('\n');

        let currentLine = 0;
        let inHunk = false;

        for (const line of lines) {
            const hunkMatch = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
            if (hunkMatch) {
                currentLine = parseInt(hunkMatch[1], 10);
                inHunk = true;
                continue;
            }

            if (inHunk) {
                if (line.startsWith('+') && !line.startsWith('+++')) {
                    // Added line
                    result[filename].addedLines.push({
                        lineNumber: currentLine,
                        content: line.slice(1),
                    });
                    currentLine++;
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                    // Deleted line - don't increment
                } else if (!line.startsWith('\\')) {
                    // Context line
                    currentLine++;
                }
            }
        }
    }

    return result;
}

/**
 * Get file extension
 */
function getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot >= 0 ? filename.slice(lastDot) : '';
}

/**
 * Remove duplicate suggestions (same file + line number)
 */
function deduplicateSuggestions(suggestions: FixSuggestion[]): FixSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(s => {
        const key = `${s.file}:${s.line}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

/**
 * Format fix suggestions for PR comment
 */
export function formatFixSuggestionsComment(
    suggestions: FixSuggestion[],
    baseUrl: string = process.env.NEXTAUTH_URL || 'http://localhost:3000'
): string {
    if (suggestions.length === 0) {
        return '';
    }

    const lines: string[] = [
        '## 🔧 Auto-Fix Suggestions',
        '',
        'PullPilot detected issues that can be automatically fixed. Click "Apply Fix" to create a commit.',
        '',
        '| Issue | File | Line | Action |',
        '|-------|------|------|--------|',
    ];

    for (const fix of suggestions) {
        // Use the /fix/ page for a better UX instead of API directly
        const fixUrl = `${baseUrl}/fix?id=${fix.id}`;
        const description = fix.description;
        const file = `\`${fix.file}\``;
        const line = fix.line.toString();
        const action = `[✨ Apply Fix](${fixUrl})`;

        lines.push(`| ${description} | ${file} | ${line} | ${action} |`);
    }

    lines.push('');
    lines.push('> **Note**: Only the PR author or repository maintainers can apply these fixes.');

    return lines.join('\n');
}

/**
 * Get the default auto-fix config, merging with user config from .pullpilot.yml
 */
export function getAutoFixConfig(userConfig?: Partial<AutoFixConfig>): AutoFixConfig {
    if (!userConfig) {
        return DEFAULT_AUTOFIX_CONFIG;
    }

    return {
        enabled: userConfig.enabled ?? DEFAULT_AUTOFIX_CONFIG.enabled,
        types: {
            ...DEFAULT_AUTOFIX_CONFIG.types,
            ...(userConfig.types || {}),
        },
        min_confidence: userConfig.min_confidence ?? DEFAULT_AUTOFIX_CONFIG.min_confidence,
    };
}
