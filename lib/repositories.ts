import { supabaseAdmin } from './supabase';

export interface GitHubInstallation {
    id: string;
    installation_id: number;
    account_id: number;
    account_login: string;
    account_type: string;
    target_type: string;
    user_id: string;
    installed_at: string;
    updated_at: string;
}

export interface Repository {
    id: string;
    installation_id: string;
    repo_id: number;
    repo_name: string;
    repo_full_name: string;
    owner_login: string;
    is_private: boolean;
    default_branch: string;
    created_at: string;
    updated_at: string;
}

export interface PullRequestReview {
    id: string;
    repository_id: string;
    pr_number: number;
    pr_title: string;
    pr_author: string;
    review_summary: string;
    files_changed: number;
    additions: number;
    deletions: number;
    ai_model: string;
    review_posted_at: string;
    created_at: string;
}

/**
 * Store GitHub App installation
 */
export async function storeInstallation(data: {
    installation_id: number;
    account_id: number;
    account_login: string;
    account_type: string;
    target_type: string;
    user_id: string;
}) {
    const { data: installation, error } = await supabaseAdmin
        .from('github_installations')
        .upsert({
            installation_id: data.installation_id,
            account_id: data.account_id,
            account_login: data.account_login,
            account_type: data.account_type,
            target_type: data.target_type,
            user_id: data.user_id,
        }, {
            onConflict: 'installation_id'
        })
        .select()
        .single();

    if (error) {
        console.error('Error storing installation:', error);
        throw error;
    }

    return installation as GitHubInstallation;
}

/**
 * Get installation by installation_id
 */
export async function getInstallationById(installation_id: number) {
    const { data, error } = await supabaseAdmin
        .from('github_installations')
        .select('*')
        .eq('installation_id', installation_id)
        .maybeSingle();

    if (error) {
        console.error('Error fetching installation:', error);
        throw error;
    }

    return data as GitHubInstallation | null;
}

/**
 * Get all installations for a user
 */
export async function getUserInstallations(user_id: string) {
    const { data, error } = await supabaseAdmin
        .from('github_installations')
        .select('*')
        .eq('user_id', user_id)
        .order('installed_at', { ascending: false });

    if (error) {
        console.error('Error fetching user installations:', error);
        throw error;
    }

    return data as GitHubInstallation[];
}

/**
 * Store repository
 */
export async function storeRepository(data: {
    installation_id: string;
    repo_id: number;
    repo_name: string;
    repo_full_name: string;
    owner_login: string;
    is_private: boolean;
    default_branch: string;
}) {
    const { data: repository, error } = await supabaseAdmin
        .from('repositories')
        .upsert({
            installation_id: data.installation_id,
            repo_id: data.repo_id,
            repo_name: data.repo_name,
            repo_full_name: data.repo_full_name,
            owner_login: data.owner_login,
            is_private: data.is_private,
            default_branch: data.default_branch,
        }, {
            onConflict: 'repo_id'
        })
        .select()
        .single();

    if (error) {
        console.error('Error storing repository:', error);
        throw error;
    }

    return repository as Repository;
}

/**
 * Get repositories for an installation
 */
export async function getInstallationRepositories(installation_id: string) {
    const { data, error } = await supabaseAdmin
        .from('repositories')
        .select('*')
        .eq('installation_id', installation_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching repositories:', error);
        throw error;
    }

    return data as Repository[];
}

/**
 * Get repository by repo_id
 */
export async function getRepositoryByRepoId(repo_id: number) {
    const { data, error } = await supabaseAdmin
        .from('repositories')
        .select('*')
        .eq('repo_id', repo_id)
        .maybeSingle();

    if (error) {
        console.error('Error fetching repository:', error);
        throw error;
    }

    return data as Repository | null;
}

/**
 * Store PR review
 */
export async function storePRReview(data: {
    repository_id: string;
    pr_number: number;
    pr_title: string;
    pr_author: string;
    review_summary: string;
    files_changed: number;
    additions: number;
    deletions: number;
    ai_model: string;
}) {
    const { data: review, error } = await supabaseAdmin
        .from('pull_request_reviews')
        .insert({
            repository_id: data.repository_id,
            pr_number: data.pr_number,
            pr_title: data.pr_title,
            pr_author: data.pr_author,
            review_summary: data.review_summary,
            files_changed: data.files_changed,
            additions: data.additions,
            deletions: data.deletions,
            ai_model: data.ai_model,
        })
        .select()
        .single();

    if (error) {
        console.error('Error storing PR review:', error);
        throw error;
    }

    return review as PullRequestReview;
}

/**
 * Get PR reviews for a repository
 */
export async function getRepositoryReviews(repository_id: string, limit = 50) {
    const { data, error } = await supabaseAdmin
        .from('pull_request_reviews')
        .select('*')
        .eq('repository_id', repository_id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching PR reviews:', error);
        throw error;
    }

    return data as PullRequestReview[];
}

/**
 * Delete installation and cascade delete repositories and reviews
 */
export async function deleteInstallation(installation_id: number) {
    const { error } = await supabaseAdmin
        .from('github_installations')
        .delete()
        .eq('installation_id', installation_id);

    if (error) {
        console.error('Error deleting installation:', error);
        throw error;
    }

    return true;
}

// ========== SECURITY FINDINGS ==========

export interface SecurityFindingRecord {
    id: string;
    review_id: string;
    rule_id: string;
    rule_name: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    message: string;
    file_path: string | null;
    line_number: number | null;
    code_snippet: string | null;
    created_at: string;
}

export interface SecuritySummary {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
}

/**
 * Store security findings for a PR review
 */
export async function storeSecurityFindings(
    review_id: string,
    findings: Array<{
        ruleId: string;
        ruleName: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        category: string;
        message: string;
        file: string;
        line?: number;
        snippet?: string;
    }>
): Promise<SecurityFindingRecord[]> {
    if (findings.length === 0) {
        return [];
    }

    const records = findings.map(f => ({
        review_id,
        rule_id: f.ruleId,
        rule_name: f.ruleName,
        severity: f.severity,
        category: f.category,
        message: f.message,
        file_path: f.file,
        line_number: f.line ?? null,
        code_snippet: f.snippet ?? null,
    }));

    const { data, error } = await supabaseAdmin
        .from('security_findings')
        .insert(records)
        .select();

    if (error) {
        console.error('Error storing security findings:', error);
        throw error;
    }

    return data as SecurityFindingRecord[];
}

/**
 * Update PR review with security summary counts
 */
export async function updateReviewSecuritySummary(
    review_id: string,
    summary: SecuritySummary
): Promise<void> {
    const { error } = await supabaseAdmin
        .from('pull_request_reviews')
        .update({
            security_critical: summary.critical,
            security_high: summary.high,
            security_medium: summary.medium,
            security_low: summary.low,
            security_total: summary.total,
        })
        .eq('id', review_id);

    if (error) {
        console.error('Error updating review security summary:', error);
        throw error;
    }
}

/**
 * Get security findings for a PR review
 */
export async function getReviewSecurityFindings(review_id: string): Promise<SecurityFindingRecord[]> {
    const { data, error } = await supabaseAdmin
        .from('security_findings')
        .select('*')
        .eq('review_id', review_id)
        .order('severity', { ascending: true });

    if (error) {
        console.error('Error fetching security findings:', error);
        throw error;
    }

    return data as SecurityFindingRecord[];
}

/**
 * Get security findings summary for a repository
 */
export async function getRepositorySecuritySummary(repository_id: string): Promise<{
    totalFindings: number;
    bySeverity: SecuritySummary;
    byCategory: Record<string, number>;
    recentFindings: SecurityFindingRecord[];
}> {
    // Get all reviews for the repository
    const { data: reviews, error: reviewsError } = await supabaseAdmin
        .from('pull_request_reviews')
        .select('id, security_critical, security_high, security_medium, security_low, security_total')
        .eq('repository_id', repository_id);

    if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        throw reviewsError;
    }

    // Aggregate security summary
    const bySeverity: SecuritySummary = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0,
    };

    for (const review of reviews || []) {
        bySeverity.critical += review.security_critical || 0;
        bySeverity.high += review.security_high || 0;
        bySeverity.medium += review.security_medium || 0;
        bySeverity.low += review.security_low || 0;
        bySeverity.total += review.security_total || 0;
    }

    // Get recent findings with category breakdown
    const reviewIds = (reviews || []).map(r => r.id);

    if (reviewIds.length === 0) {
        return {
            totalFindings: 0,
            bySeverity,
            byCategory: {},
            recentFindings: [],
        };
    }

    const { data: findings, error: findingsError } = await supabaseAdmin
        .from('security_findings')
        .select('*')
        .in('review_id', reviewIds)
        .order('created_at', { ascending: false })
        .limit(20);

    if (findingsError) {
        console.error('Error fetching findings:', findingsError);
        throw findingsError;
    }

    // Count by category
    const byCategory: Record<string, number> = {};
    for (const finding of findings || []) {
        byCategory[finding.category] = (byCategory[finding.category] || 0) + 1;
    }

    return {
        totalFindings: bySeverity.total,
        bySeverity,
        byCategory,
        recentFindings: findings as SecurityFindingRecord[],
    };
}
