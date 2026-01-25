/**
 * Security Scanner for Pull Request Diffs
 * 
 * Scans code changes for security vulnerabilities using pattern matching.
 * Integrates with the AI reviewer to provide comprehensive security feedback.
 */

import {
    SECURITY_RULES,
    SecurityRule,
    SecuritySeverity,
    SecurityCategory,
    getSeverityPriority
} from './security-rules';

export interface SecurityFinding {
    ruleId: string;
    ruleName: string;
    severity: SecuritySeverity;
    category: SecurityCategory;
    message: string;
    file: string;
    line?: number;
    snippet?: string;
}

export interface SecurityScanResult {
    findings: SecurityFinding[];
    summary: SecuritySummary;
    scannedFiles: number;
    scanTime: number;  // milliseconds
}

export interface SecuritySummary {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
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
 * Scan PR diff for security vulnerabilities
 */
export function scanForSecurityIssues(
    diff: string,
    files: PRFile[]
): SecurityScanResult {
    const startTime = Date.now();
    const findings: SecurityFinding[] = [];

    // Parse diff to get file-specific changes
    const fileChanges = parseDiff(diff);

    // Scan each file's changes
    for (const [filename, content] of Object.entries(fileChanges)) {
        const fileFindings = scanFileContent(filename, content);
        findings.push(...fileFindings);
    }

    // Sort findings by severity (critical first)
    findings.sort((a, b) =>
        getSeverityPriority(a.severity) - getSeverityPriority(b.severity)
    );

    // Generate summary
    const summary = generateSummary(findings);

    return {
        findings,
        summary,
        scannedFiles: Object.keys(fileChanges).length,
        scanTime: Date.now() - startTime,
    };
}

/**
 * Parse unified diff format to extract file contents
 */
function parseDiff(diff: string): Record<string, string> {
    const fileChanges: Record<string, string> = {};
    const lines = diff.split('\n');

    let currentFile = '';
    let content: string[] = [];

    for (const line of lines) {
        // New file header
        if (line.startsWith('diff --git')) {
            // Save previous file
            if (currentFile && content.length > 0) {
                fileChanges[currentFile] = content.join('\n');
            }
            // Extract filename from: diff --git a/path/file b/path/file
            const match = line.match(/diff --git a\/(.*) b\/(.*)/);
            if (match) {
                currentFile = match[2];
            }
            content = [];
        }
        // Only include added lines (lines starting with +, but not +++)
        else if (line.startsWith('+') && !line.startsWith('+++')) {
            content.push(line.substring(1)); // Remove the + prefix
        }
    }

    // Save last file
    if (currentFile && content.length > 0) {
        fileChanges[currentFile] = content.join('\n');
    }

    return fileChanges;
}

/**
 * Scan file content against security rules
 */
function scanFileContent(filename: string, content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const fileExtension = getFileExtension(filename);

    for (const rule of SECURITY_RULES) {
        // Check if rule applies to this file type
        if (rule.fileExtensions && !rule.fileExtensions.includes(fileExtension)) {
            continue;
        }

        // Check each pattern
        for (const pattern of rule.patterns) {
            // Reset regex lastIndex for global patterns
            pattern.lastIndex = 0;

            let match: RegExpExecArray | null;
            while ((match = pattern.exec(content)) !== null) {
                // Check exclusions
                if (rule.exclude && rule.exclude.some(ex => ex.test(match![0]))) {
                    continue;
                }

                // Calculate line number
                const lineNumber = getLineNumber(content, match.index);

                // Get code snippet (the matching line)
                const snippet = getSnippet(content, match.index);

                findings.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    severity: rule.severity,
                    category: rule.category,
                    message: rule.description,
                    file: filename,
                    line: lineNumber,
                    snippet: snippet,
                });

                // Prevent infinite loops on zero-length matches
                if (match[0].length === 0) {
                    pattern.lastIndex++;
                }
            }
        }
    }

    // Deduplicate findings (same rule, same line)
    return deduplicateFindings(findings);
}

/**
 * Get file extension including the dot
 */
function getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot >= 0 ? filename.substring(lastDot) : '';
}

/**
 * Calculate line number from character index
 */
function getLineNumber(content: string, charIndex: number): number {
    const beforeMatch = content.substring(0, charIndex);
    return beforeMatch.split('\n').length;
}

/**
 * Get the line containing the match as a snippet
 */
function getSnippet(content: string, charIndex: number): string {
    const lines = content.split('\n');
    const lineNumber = getLineNumber(content, charIndex) - 1;
    const line = lines[lineNumber] || '';

    // Truncate long lines
    if (line.length > 100) {
        return line.substring(0, 97) + '...';
    }
    return line;
}

/**
 * Remove duplicate findings (same rule + same line)
 */
function deduplicateFindings(findings: SecurityFinding[]): SecurityFinding[] {
    const seen = new Set<string>();
    return findings.filter(finding => {
        const key = `${finding.ruleId}:${finding.file}:${finding.line}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

/**
 * Generate summary counts by severity
 */
function generateSummary(findings: SecurityFinding[]): SecuritySummary {
    const summary: SecuritySummary = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: findings.length,
    };

    for (const finding of findings) {
        summary[finding.severity]++;
    }

    return summary;
}

/**
 * Format security findings as a GitHub comment section
 */
export function formatSecurityComment(result: SecurityScanResult): string {
    if (result.findings.length === 0) {
        return `## 🔒 Security Scan Results\n\n✅ **No security issues detected!**\n\nScanned ${result.scannedFiles} file(s) in ${result.scanTime}ms.`;
    }

    let comment = `## 🔒 Security Scan Results\n\n`;

    // Summary badges
    const { summary } = result;
    if (summary.critical > 0) {
        comment += `🔴 **${summary.critical} Critical** `;
    }
    if (summary.high > 0) {
        comment += `🟠 **${summary.high} High** `;
    }
    if (summary.medium > 0) {
        comment += `🟡 **${summary.medium} Medium** `;
    }
    if (summary.low > 0) {
        comment += `🟢 **${summary.low} Low** `;
    }
    comment += `\n\n`;

    // Group findings by severity
    const criticalFindings = result.findings.filter(f => f.severity === 'critical');
    const highFindings = result.findings.filter(f => f.severity === 'high');
    const mediumFindings = result.findings.filter(f => f.severity === 'medium');
    const lowFindings = result.findings.filter(f => f.severity === 'low');

    // Critical findings (expanded)
    if (criticalFindings.length > 0) {
        comment += `### 🔴 Critical Issues\n\n`;
        for (const finding of criticalFindings) {
            comment += formatFinding(finding);
        }
    }

    // High findings (expanded)
    if (highFindings.length > 0) {
        comment += `### 🟠 High Severity Issues\n\n`;
        for (const finding of highFindings) {
            comment += formatFinding(finding);
        }
    }

    // Medium findings (collapsed if many)
    if (mediumFindings.length > 0) {
        if (mediumFindings.length > 3) {
            comment += `<details>\n<summary><b>🟡 ${mediumFindings.length} Medium Severity Issues</b></summary>\n\n`;
            for (const finding of mediumFindings) {
                comment += formatFinding(finding);
            }
            comment += `</details>\n\n`;
        } else {
            comment += `### 🟡 Medium Severity Issues\n\n`;
            for (const finding of mediumFindings) {
                comment += formatFinding(finding);
            }
        }
    }

    // Low findings (collapsed)
    if (lowFindings.length > 0) {
        comment += `<details>\n<summary><b>🟢 ${lowFindings.length} Low Severity Issues</b></summary>\n\n`;
        for (const finding of lowFindings) {
            comment += formatFinding(finding);
        }
        comment += `</details>\n\n`;
    }

    comment += `---\n*Security scan completed in ${result.scanTime}ms • ${result.scannedFiles} file(s) scanned*`;

    return comment;
}

/**
 * Format a single finding
 */
function formatFinding(finding: SecurityFinding): string {
    let text = `**\`${finding.ruleId}\`** ${finding.ruleName}\n`;
    text += `📁 \`${finding.file}\``;
    if (finding.line) {
        text += ` (line ${finding.line})`;
    }
    text += `\n`;
    text += `> ${finding.message}\n`;
    if (finding.snippet) {
        text += `\`\`\`\n${finding.snippet}\n\`\`\`\n`;
    }
    text += `\n`;
    return text;
}

/**
 * Check if any critical or high severity issues were found
 */
export function hasBlockingIssues(result: SecurityScanResult): boolean {
    return result.summary.critical > 0 || result.summary.high > 0;
}
