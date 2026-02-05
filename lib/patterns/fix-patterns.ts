/**
 * Fix Detection Patterns
 * 
 * Regex patterns for detecting auto-fixable code issues.
 * Each pattern includes a generateFix callback that produces the fix.
 */

// ========== TYPES ==========

export type FixType = 'remove_line' | 'replace_line' | 'insert_line';

export interface FixPattern {
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

// ========== FIX PATTERNS ==========

export const FIX_PATTERNS: FixPattern[] = [
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
