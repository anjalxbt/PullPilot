/**
 * Custom Review Rules Engine
 * 
 * Evaluates custom rules against pull request context.
 */

import { minimatch } from 'minimatch';
import {
    PullPilotConfig,
    CustomRule,
    RuleViolation,
    RuleSeverity,
    getEnabledRules,
} from './rules-config';

// ========== PR Context ==========

export interface PRContext {
    additions: number;
    deletions: number;
    changedFiles: string[];
    diff: string;
    reviewerCount: number;
    hasCodeownersApproval: boolean;
    isDraft: boolean;
}

// ========== Evaluation Result ==========

export interface RulesEvaluationResult {
    violations: RuleViolation[];
    hasErrors: boolean;
    hasWarnings: boolean;
    summary: {
        total: number;
        errors: number;
        warnings: number;
        info: number;
    };
}

// ========== Main Evaluation Function ==========

/**
 * Evaluate all enabled rules against the PR context
 */
export function evaluateRules(
    config: PullPilotConfig,
    prContext: PRContext
): RulesEvaluationResult {
    const enabledRules = getEnabledRules(config);
    const violations: RuleViolation[] = [];

    for (const rule of enabledRules) {
        const violation = evaluateRule(rule, prContext);
        if (violation) {
            violations.push(violation);
        }
    }

    const summary = {
        total: violations.length,
        errors: violations.filter(v => v.severity === 'error').length,
        warnings: violations.filter(v => v.severity === 'warning').length,
        info: violations.filter(v => v.severity === 'info').length,
    };

    return {
        violations,
        hasErrors: summary.errors > 0,
        hasWarnings: summary.warnings > 0,
        summary,
    };
}

/**
 * Evaluate a single rule
 */
function evaluateRule(rule: CustomRule, ctx: PRContext): RuleViolation | null {
    switch (rule.type) {
        case 'pr-size':
            return evaluatePRSizeRule(rule, ctx);
        case 'file-pattern':
            return evaluateFilePatternRule(rule, ctx);
        case 'content-pattern':
            return evaluateContentPatternRule(rule, ctx);
        case 'reviewers':
            return evaluateReviewersRule(rule, ctx);
        default:
            console.warn(`Unknown rule type: ${(rule as any).type}`);
            return null;
    }
}

// ========== Individual Rule Evaluators ==========

/**
 * Evaluate PR size rules (line count, file count)
 */
function evaluatePRSizeRule(rule: CustomRule, ctx: PRContext): RuleViolation | null {
    const { condition } = rule;
    const totalLines = ctx.additions + ctx.deletions;

    // Check max lines
    if (condition.max_lines && totalLines > condition.max_lines) {
        return createViolation(rule, `PR has ${totalLines} lines changed (max: ${condition.max_lines})`);
    }

    // Check max additions
    if (condition.max_additions && ctx.additions > condition.max_additions) {
        return createViolation(rule, `PR has ${ctx.additions} additions (max: ${condition.max_additions})`);
    }

    // Check max deletions
    if (condition.max_deletions && ctx.deletions > condition.max_deletions) {
        return createViolation(rule, `PR has ${ctx.deletions} deletions (max: ${condition.max_deletions})`);
    }

    // Check max files
    if (condition.max_files && ctx.changedFiles.length > condition.max_files) {
        return createViolation(rule, `PR has ${ctx.changedFiles.length} files changed (max: ${condition.max_files})`);
    }

    return null;
}

/**
 * Evaluate file pattern rules (require files, block files)
 */
function evaluateFilePatternRule(rule: CustomRule, ctx: PRContext): RuleViolation | null {
    const { condition } = rule;

    // Check if changed_files pattern matches any files
    if (condition.changed_files) {
        const matchedFiles = ctx.changedFiles.filter(file =>
            minimatch(file, condition.changed_files!, { matchBase: true })
        );

        if (matchedFiles.length === 0) {
            // Pattern doesn't match any files - rule doesn't apply
            return null;
        }

        // Check if require_files are also changed
        if (condition.require_files) {
            const hasRequiredFiles = ctx.changedFiles.some(file =>
                minimatch(file, condition.require_files!, { matchBase: true })
            );

            if (!hasRequiredFiles) {
                return createViolation(
                    rule,
                    `Changes to "${condition.changed_files}" require corresponding changes to "${condition.require_files}"`
                );
            }
        }
    }

    // Check if blocked files are changed
    if (condition.block_files) {
        const blockedFiles = ctx.changedFiles.filter(file =>
            minimatch(file, condition.block_files!, { matchBase: true })
        );

        if (blockedFiles.length > 0) {
            return createViolation(
                rule,
                `Blocked files modified: ${blockedFiles.join(', ')}`
            );
        }
    }

    return null;
}

/**
 * Evaluate content pattern rules (regex search in diff)
 */
function evaluateContentPatternRule(rule: CustomRule, ctx: PRContext): RuleViolation | null {
    const { condition } = rule;

    if (!condition.pattern) {
        return null;
    }

    // Filter relevant files by extension if specified
    let relevantFiles = ctx.changedFiles;
    if (condition.file_extensions && condition.file_extensions.length > 0) {
        relevantFiles = ctx.changedFiles.filter(file =>
            condition.file_extensions!.some(ext => file.endsWith(ext))
        );
    }

    // Exclude paths if specified
    if (condition.exclude_paths && condition.exclude_paths.length > 0) {
        relevantFiles = relevantFiles.filter(file =>
            !condition.exclude_paths!.some(pattern =>
                minimatch(file, pattern, { matchBase: true })
            )
        );
    }

    if (relevantFiles.length === 0) {
        return null;
    }

    // Search for pattern in diff
    try {
        const regex = new RegExp(condition.pattern, 'gm');
        const matches = ctx.diff.match(regex);

        if (matches && matches.length > 0) {
            return createViolation(
                rule,
                `Found ${matches.length} occurrence(s) of pattern "${condition.pattern}"`
            );
        }
    } catch (error) {
        console.error(`Invalid regex pattern in rule ${rule.id}:`, error);
    }

    return null;
}

/**
 * Evaluate reviewer rules
 */
function evaluateReviewersRule(rule: CustomRule, ctx: PRContext): RuleViolation | null {
    const { condition } = rule;

    // Check minimum reviewers
    if (condition.min_reviewers && ctx.reviewerCount < condition.min_reviewers) {
        return createViolation(
            rule,
            `PR has ${ctx.reviewerCount} reviewers (minimum: ${condition.min_reviewers})`
        );
    }

    // Check CODEOWNERS approval
    if (condition.require_codeowners && !ctx.hasCodeownersApproval) {
        return createViolation(rule, 'CODEOWNERS approval required');
    }

    return null;
}

// ========== Helper Functions ==========

/**
 * Create a RuleViolation object
 */
function createViolation(rule: CustomRule, details: string): RuleViolation {
    return {
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        message: rule.message,
        details,
    };
}

/**
 * Get severity emoji
 */
function getSeverityEmoji(severity: RuleSeverity): string {
    switch (severity) {
        case 'error':
            return '❌';
        case 'warning':
            return '⚠️';
        case 'info':
            return 'ℹ️';
        default:
            return '•';
    }
}

/**
 * Format rule violations as a GitHub comment
 */
export function formatRulesComment(result: RulesEvaluationResult): string {
    if (result.violations.length === 0) {
        return '';
    }

    const lines: string[] = [
        '## 📋 Custom Rules Check',
        '',
    ];

    // Summary
    const summaryParts: string[] = [];
    if (result.summary.errors > 0) {
        summaryParts.push(`${result.summary.errors} error(s)`);
    }
    if (result.summary.warnings > 0) {
        summaryParts.push(`${result.summary.warnings} warning(s)`);
    }
    if (result.summary.info > 0) {
        summaryParts.push(`${result.summary.info} info`);
    }
    lines.push(`Found ${summaryParts.join(', ')}`);
    lines.push('');

    // Group by severity
    const errors = result.violations.filter(v => v.severity === 'error');
    const warnings = result.violations.filter(v => v.severity === 'warning');
    const infos = result.violations.filter(v => v.severity === 'info');

    if (errors.length > 0) {
        lines.push('### ❌ Errors');
        lines.push('');
        for (const v of errors) {
            lines.push(`- **${v.ruleName}**: ${v.message}`);
            if (v.details) {
                lines.push(`  - _${v.details}_`);
            }
        }
        lines.push('');
    }

    if (warnings.length > 0) {
        lines.push('### ⚠️ Warnings');
        lines.push('');
        for (const v of warnings) {
            lines.push(`- **${v.ruleName}**: ${v.message}`);
            if (v.details) {
                lines.push(`  - _${v.details}_`);
            }
        }
        lines.push('');
    }

    if (infos.length > 0) {
        lines.push('### ℹ️ Info');
        lines.push('');
        for (const v of infos) {
            lines.push(`- **${v.ruleName}**: ${v.message}`);
            if (v.details) {
                lines.push(`  - _${v.details}_`);
            }
        }
        lines.push('');
    }

    lines.push('---');
    lines.push('_Configured via `.pullpilot.yml`_');

    return lines.join('\n');
}
