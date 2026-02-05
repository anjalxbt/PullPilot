/**
 * Security Rules Configuration
 * 
 * OWASP-inspired security detection patterns for code review.
 * Each rule defines a regex pattern, severity, and description.
 */

export interface SecurityRule {
    id: string;
    name: string;
    category: SecurityCategory;
    severity: SecuritySeverity;
    description: string;
    patterns: RegExp[];
    fileExtensions?: string[];  // If specified, only check these file types
    exclude?: RegExp[];         // Patterns to exclude (reduce false positives)
}

export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low';
export type SecurityCategory =
    | 'secrets'
    | 'injection'
    | 'xss'
    | 'command-injection'
    | 'path-traversal'
    | 'hardcoded-config'
    | 'insecure-crypto'
    | 'debug-code';

/**
 * Security rules based on OWASP guidelines
 */
export const SECURITY_RULES: SecurityRule[] = [
    // ========== SECRETS DETECTION ==========
    {
        id: 'SEC001',
        name: 'Hardcoded API Key',
        category: 'secrets',
        severity: 'critical',
        description: 'Detected hardcoded API key or secret token',
        patterns: [
            // Generic API keys
            /(['"`])(?:api[_-]?key|apikey|api[_-]?secret)\1\s*[:=]\s*(['"`])[a-zA-Z0-9_\-]{16,}\2/gi,
            // OpenAI keys
            /sk-[a-zA-Z0-9]{20,}/g,
            // Stripe keys
            /(?:sk|pk)_(?:live|test)_[a-zA-Z0-9]{24,}/g,
            // Generic secret patterns
            /(['"`])(?:secret|password|passwd|pwd|token|auth[_-]?token|access[_-]?token)\1\s*[:=]\s*(['"`])[^'"`]{8,}\2/gi,
        ],
        exclude: [
            /process\.env\./,
            /\$\{.*\}/,
            /<%.*%>/,
        ],
    },
    {
        id: 'SEC002',
        name: 'AWS Credentials',
        category: 'secrets',
        severity: 'critical',
        description: 'Detected AWS access key or secret key',
        patterns: [
            // AWS Access Key ID
            /AKIA[0-9A-Z]{16}/g,
            // AWS Secret Access Key (usually follows an access key)
            /(['"`])(?:aws[_-]?secret[_-]?access[_-]?key|aws[_-]?secret)\1\s*[:=]\s*(['"`])[A-Za-z0-9/+=]{40}\2/gi,
        ],
    },
    {
        id: 'SEC003',
        name: 'Private Key',
        category: 'secrets',
        severity: 'critical',
        description: 'Detected private key in code',
        patterns: [
            /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g,
            /-----BEGIN PGP PRIVATE KEY BLOCK-----/g,
        ],
    },
    {
        id: 'SEC004',
        name: 'GitHub Token',
        category: 'secrets',
        severity: 'critical',
        description: 'Detected GitHub personal access token or OAuth token',
        patterns: [
            /ghp_[a-zA-Z0-9]{36}/g,  // Personal access token
            /gho_[a-zA-Z0-9]{36}/g,  // OAuth token
            /ghu_[a-zA-Z0-9]{36}/g,  // User-to-server token
            /ghs_[a-zA-Z0-9]{36}/g,  // Server-to-server token
            /ghr_[a-zA-Z0-9]{36}/g,  // Refresh token
        ],
    },

    // ========== SQL INJECTION ==========
    {
        id: 'SEC010',
        name: 'SQL Injection Risk',
        category: 'injection',
        severity: 'high',
        description: 'Potential SQL injection via string concatenation or template literals',
        patterns: [
            // String concatenation in SQL
            /(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE).*\+\s*(?:req\.|request\.|params\.|query\.|body\.)/gi,
            // Template literals with variables in SQL
            /(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)[^`]*\$\{[^}]+\}/gi,
            // f-strings or format strings (Python)
            /f['"](?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)[^'"]*\{[^}]+\}/gi,
        ],
        fileExtensions: ['.ts', '.js', '.tsx', '.jsx', '.py'],
        exclude: [
            /\?\s*,/,  // Parameterized queries
            /\$\d+/,   // PostgreSQL parameters
        ],
    },

    // ========== XSS (Cross-Site Scripting) ==========
    {
        id: 'SEC020',
        name: 'Dangerous innerHTML Usage',
        category: 'xss',
        severity: 'high',
        description: 'Using innerHTML with potentially unsafe content',
        patterns: [
            /\.innerHTML\s*=\s*(?!['"`]<)/g,
            /\.outerHTML\s*=\s*(?!['"`]<)/g,
        ],
        fileExtensions: ['.ts', '.js', '.tsx', '.jsx', '.html'],
    },
    {
        id: 'SEC021',
        name: 'React dangerouslySetInnerHTML',
        category: 'xss',
        severity: 'high',
        description: 'Using dangerouslySetInnerHTML without sanitization',
        patterns: [
            /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/g,
        ],
        fileExtensions: ['.tsx', '.jsx', '.ts', '.js'],
    },
    {
        id: 'SEC022',
        name: 'Document.write Usage',
        category: 'xss',
        severity: 'medium',
        description: 'document.write can be exploited for XSS attacks',
        patterns: [
            /document\.write\s*\(/g,
            /document\.writeln\s*\(/g,
        ],
    },

    // ========== COMMAND INJECTION ==========
    {
        id: 'SEC030',
        name: 'Command Injection Risk',
        category: 'command-injection',
        severity: 'critical',
        description: 'Potential command injection via exec/spawn with user input',
        patterns: [
            /(?:exec|execSync|spawn|spawnSync)\s*\([^)]*(?:req\.|request\.|params\.|query\.|body\.)/gi,
            /child_process.*(?:exec|spawn)/gi,
        ],
        fileExtensions: ['.ts', '.js', '.tsx', '.jsx'],
    },
    {
        id: 'SEC031',
        name: 'Eval Usage',
        category: 'command-injection',
        severity: 'critical',
        description: 'eval() is dangerous and can execute arbitrary code',
        patterns: [
            /\beval\s*\(/g,
            /new\s+Function\s*\(/g,
            /setTimeout\s*\(\s*['"`]/g,
            /setInterval\s*\(\s*['"`]/g,
        ],
        fileExtensions: ['.ts', '.js', '.tsx', '.jsx'],
        exclude: [
            /['"]use strict['"]/,
        ],
    },

    // ========== PATH TRAVERSAL ==========
    {
        id: 'SEC040',
        name: 'Path Traversal Risk',
        category: 'path-traversal',
        severity: 'high',
        description: 'Potential path traversal vulnerability',
        patterns: [
            /(?:readFile|writeFile|readFileSync|writeFileSync|createReadStream|createWriteStream)\s*\([^)]*(?:req\.|request\.|params\.|query\.|body\.)/gi,
            /path\.join\s*\([^)]*(?:req\.|request\.|params\.|query\.|body\.)/gi,
        ],
        fileExtensions: ['.ts', '.js', '.tsx', '.jsx'],
    },

    // ========== HARDCODED CONFIGURATION ==========
    {
        id: 'SEC050',
        name: 'Hardcoded Localhost URL',
        category: 'hardcoded-config',
        severity: 'low',
        description: 'Hardcoded localhost URL may cause issues in production',
        patterns: [
            /(['"`])https?:\/\/localhost[:\d]*[^'"`]*\1/g,
            /(['"`])https?:\/\/127\.0\.0\.1[:\d]*[^'"`]*\1/g,
        ],
        exclude: [
            /\.env/,
            /\.example/,
            /test/i,
            /spec/i,
        ],
    },
    {
        id: 'SEC051',
        name: 'Hardcoded Internal IP',
        category: 'hardcoded-config',
        severity: 'medium',
        description: 'Hardcoded internal IP address detected',
        patterns: [
            /(['"`])https?:\/\/(?:10\.|172\.(?:1[6-9]|2\d|3[01])\.|192\.168\.)[^\s'"`]*\1/g,
        ],
    },

    // ========== INSECURE CRYPTO ==========
    {
        id: 'SEC060',
        name: 'Weak Hash Algorithm',
        category: 'insecure-crypto',
        severity: 'medium',
        description: 'MD5 and SHA1 are cryptographically weak for security purposes',
        patterns: [
            /createHash\s*\(\s*['"`]md5['"`]\s*\)/gi,
            /createHash\s*\(\s*['"`]sha1['"`]\s*\)/gi,
            /hashlib\.md5/gi,
            /hashlib\.sha1/gi,
        ],
    },
    {
        id: 'SEC061',
        name: 'Disabled SSL Verification',
        category: 'insecure-crypto',
        severity: 'high',
        description: 'SSL certificate verification is disabled',
        patterns: [
            /rejectUnauthorized\s*:\s*false/g,
            /NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"`]?0['"`]?/g,
            /verify\s*=\s*False/g,  // Python requests
        ],
    },

    // ========== DEBUG CODE ==========
    {
        id: 'SEC070',
        name: 'Debug Code in Production',
        category: 'debug-code',
        severity: 'low',
        description: 'Debug statements should be removed before production',
        patterns: [
            /console\.log\s*\([^)]*(?:password|secret|token|key|credential)/gi,
            /debugger\s*;/g,
        ],
        exclude: [
            /test/i,
            /spec/i,
            /\.test\./i,
            /\.spec\./i,
        ],
    },
];

/**
 * Get rules by category
 */
export function getRulesByCategory(category: SecurityCategory): SecurityRule[] {
    return SECURITY_RULES.filter(rule => rule.category === category);
}

/**
 * Get rules by severity
 */
export function getRulesBySeverity(severity: SecuritySeverity): SecurityRule[] {
    return SECURITY_RULES.filter(rule => rule.severity === severity);
}

/**
 * Get severity priority for sorting (lower = more severe)
 */
export function getSeverityPriority(severity: SecuritySeverity): number {
    const priorities: Record<SecuritySeverity, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
    };
    return priorities[severity];
}
