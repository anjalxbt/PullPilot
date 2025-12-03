import { supabase } from './supabase';

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
    const { data: installation, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data: repository, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data: review, error } = await supabase
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
    const { data, error } = await supabase
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
    const { error } = await supabase
        .from('github_installations')
        .delete()
        .eq('installation_id', installation_id);

    if (error) {
        console.error('Error deleting installation:', error);
        throw error;
    }

    return true;
}
