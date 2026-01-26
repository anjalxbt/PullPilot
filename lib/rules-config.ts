/**
 * Custom Review Rules Configuration
 * 
 * Type definitions and YAML parser for .pullpilot.yml config files.
 */

import yaml from 'js-yaml';

// ========== Type Definitions ==========

export type RuleSeverity = 'error' | 'warning' | 'info';

export type RuleType = 'pr-size' | 'file-pattern' | 'content-pattern' | 'reviewers';

export interface RuleCondition {
    // PR Size conditions
    max_lines?: number;
    max_additions?: number;
    max_deletions?: number;
    max_files?: number;

    // File pattern conditions
    changed_files?: string;      // Glob pattern for changed files
    require_files?: string;      // Require these files to also be changed
    block_files?: string;        // Block changes to these files

    // Content pattern conditions
    pattern?: string;            // Regex pattern to search in diff
    file_extensions?: string[];  // Only check these extensions
    exclude_paths?: string[];    // Exclude these paths from checks

    // Reviewer conditions
    min_reviewers?: number;
    require_codeowners?: boolean;
}

export interface CustomRule {
    id: string;
    name: string;
    type: RuleType;
    condition: RuleCondition;
    severity: RuleSeverity;
    message: string;
    enabled?: boolean;  // Default: true
}

export interface PullPilotSettings {
    auto_comment?: boolean;      // Post findings as PR comments (default: true)
    ignore_draft_prs?: boolean;  // Skip checks on draft PRs (default: false)
    fail_on_error?: boolean;     // Return error status on error-severity rules (default: false)
}

export interface PullPilotConfig {
    version: number;
    rules: CustomRule[];
    settings?: PullPilotSettings;
}

export interface RuleViolation {
    ruleId: string;
    ruleName: string;
    severity: RuleSeverity;
    message: string;
    details?: string;
}

// ========== Default Settings ==========

export const DEFAULT_SETTINGS: PullPilotSettings = {
    auto_comment: true,
    ignore_draft_prs: false,
    fail_on_error: false,
};

// ========== Parser Functions ==========

/**
 * Parse YAML config string into PullPilotConfig object
 */
export function parseConfig(yamlContent: string): PullPilotConfig {
    try {
        const parsed = yaml.load(yamlContent) as any;
        return validateConfig(parsed);
    } catch (error) {
        if (error instanceof yaml.YAMLException) {
            throw new Error(`Invalid YAML syntax: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Validate and normalize config object
 */
export function validateConfig(config: any): PullPilotConfig {
    if (!config || typeof config !== 'object') {
        throw new Error('Config must be an object');
    }

    // Validate version
    if (config.version !== 1) {
        throw new Error(`Unsupported config version: ${config.version}. Expected version 1.`);
    }

    // Validate rules array
    if (!Array.isArray(config.rules)) {
        throw new Error('Config must have a "rules" array');
    }

    const validTypes: RuleType[] = ['pr-size', 'file-pattern', 'content-pattern', 'reviewers'];
    const validSeverities: RuleSeverity[] = ['error', 'warning', 'info'];

    const rules: CustomRule[] = config.rules.map((rule: any, index: number) => {
        if (!rule.id || typeof rule.id !== 'string') {
            throw new Error(`Rule at index ${index} must have a string "id"`);
        }
        if (!rule.name || typeof rule.name !== 'string') {
            throw new Error(`Rule "${rule.id}" must have a string "name"`);
        }
        if (!validTypes.includes(rule.type)) {
            throw new Error(`Rule "${rule.id}" has invalid type "${rule.type}". Valid types: ${validTypes.join(', ')}`);
        }
        if (!validSeverities.includes(rule.severity)) {
            throw new Error(`Rule "${rule.id}" has invalid severity "${rule.severity}". Valid severities: ${validSeverities.join(', ')}`);
        }
        if (!rule.condition || typeof rule.condition !== 'object') {
            throw new Error(`Rule "${rule.id}" must have a "condition" object`);
        }
        if (!rule.message || typeof rule.message !== 'string') {
            throw new Error(`Rule "${rule.id}" must have a string "message"`);
        }

        return {
            id: rule.id,
            name: rule.name,
            type: rule.type as RuleType,
            condition: rule.condition,
            severity: rule.severity as RuleSeverity,
            message: rule.message,
            enabled: rule.enabled !== false, // Default to true
        };
    });

    // Merge settings with defaults
    const settings: PullPilotSettings = {
        ...DEFAULT_SETTINGS,
        ...(config.settings || {}),
    };

    return {
        version: 1,
        rules,
        settings,
    };
}

/**
 * Get enabled rules from config
 */
export function getEnabledRules(config: PullPilotConfig): CustomRule[] {
    return config.rules.filter(rule => rule.enabled !== false);
}
