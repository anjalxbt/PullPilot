/**
 * Label Detection Patterns
 * 
 * Regex patterns and file matchers used by the auto-labeler
 * to detect appropriate labels for pull requests.
 */

// ========== TYPES ==========

export interface LabelPattern {
    keywords: RegExp[];
    filePatterns?: RegExp[];
    description: string;
}

// ========== LABEL PATTERNS ==========

export const LABEL_PATTERNS: Record<string, LabelPattern> = {
    'bug': {
        keywords: [
            /\bfix(es|ed|ing)?\b/i,
            /\bbug(s|fix)?\b/i,
            /\bissue\b/i,
            /\berror\b/i,
            /\bcrash(es|ed|ing)?\b/i,
            /\bbroken\b/i,
            /\bhotfix\b/i,
            /\bpatch\b/i,
        ],
        description: 'Bug fix detected from title/description keywords',
    },
    'feature': {
        keywords: [
            /\badd(s|ed|ing)?\b/i,
            /\bnew\b/i,
            /\bimplement(s|ed|ing|ation)?\b/i,
            /\bfeature\b/i,
            /\bcreate(s|d)?\b/i,
            /\bintroduc(e|es|ed|ing)\b/i,
        ],
        description: 'New feature detected from title/description keywords',
    },
    'enhancement': {
        keywords: [
            /\bimprov(e|es|ed|ing|ement)?\b/i,
            /\bupdate(s|d)?\b/i,
            /\brefactor(s|ed|ing)?\b/i,
            /\boptimiz(e|es|ed|ing|ation)?\b/i,
            /\benhance(s|d|ment)?\b/i,
            /\bclean(s|ed|ing|up)?\b/i,
        ],
        description: 'Enhancement/refactor detected from title/description keywords',
    },
    'documentation': {
        keywords: [
            /\bdoc(s|umentation)?\b/i,
            /\breadme\b/i,
            /\bchangelog\b/i,
        ],
        filePatterns: [
            /\.md$/i,
            /\.txt$/i,
            /\.rst$/i,
            /docs?\//i,
            /README/i,
            /CHANGELOG/i,
            /LICENSE/i,
        ],
        description: 'Documentation changes detected',
    },
    'dependencies': {
        keywords: [
            /\bdep(s|endenc(y|ies))?\b/i,
            /\bupgrade\b/i,
            /\bbump\b/i,
        ],
        filePatterns: [
            /package\.json$/,
            /package-lock\.json$/,
            /yarn\.lock$/,
            /pnpm-lock\.yaml$/,
            /requirements\.txt$/,
            /Pipfile(\.lock)?$/,
            /Cargo\.(toml|lock)$/,
            /go\.(mod|sum)$/,
            /Gemfile(\.lock)?$/,
            /composer\.(json|lock)$/,
        ],
        description: 'Dependency changes detected',
    },
    'breaking-change': {
        keywords: [
            /\bbreak(s|ing)?\b/i,
            /\bBREAKING\b/,
            /\bmajor\s+change\b/i,
            /\bremov(e|es|ed|ing)\b.*\b(api|export|function|method)\b/i,
        ],
        description: 'Breaking change detected from keywords',
    },
    'tests': {
        keywords: [
            /\btest(s|ing)?\b/i,
            /\bspec(s)?\b/i,
            /\bcoverage\b/i,
        ],
        filePatterns: [
            /\.test\.(ts|tsx|js|jsx)$/,
            /\.spec\.(ts|tsx|js|jsx)$/,
            /__tests__\//,
            /test\//,
            /tests\//,
        ],
        description: 'Test changes detected',
    },
    'ci': {
        keywords: [
            /\bci\b/i,
            /\bcd\b/i,
            /\bpipeline\b/i,
            /\bworkflow\b/i,
            /\bgithub\s*actions?\b/i,
        ],
        filePatterns: [
            /\.github\/workflows\//,
            /\.gitlab-ci\.yml$/,
            /Jenkinsfile$/,
            /\.circleci\//,
            /\.travis\.yml$/,
        ],
        description: 'CI/CD changes detected',
    },
};

// ========== FILE CLASSIFICATION PATTERNS ==========

/** File patterns that indicate source code (not tests, config, etc.) */
export const SOURCE_CODE_PATTERNS: RegExp[] = [
    /^src\//,
    /^lib\//,
    /^app\//,
    /^components\//,
    /^pages\//,
    /^api\//,
];

/** Test file patterns */
export const TEST_FILE_PATTERNS: RegExp[] = [
    /\.test\.(ts|tsx|js|jsx)$/,
    /\.spec\.(ts|tsx|js|jsx)$/,
    /__tests__\//,
    /\.test$/,
    /Test\.(ts|tsx|js|jsx)$/,
];
