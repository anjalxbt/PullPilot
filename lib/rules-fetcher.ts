/**
 * Rules Config Fetcher
 * 
 * Fetches .pullpilot.yml configuration from repository.
 */

import { getFileContent } from './github-app';
import { parseConfig, PullPilotConfig } from './rules-config';

const CONFIG_FILENAME = '.pullpilot.yml';

/**
 * Fetch and parse .pullpilot.yml from a repository
 * 
 * @param installationId - GitHub App installation ID
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param ref - Branch or commit ref (optional, defaults to default branch)
 * @returns Parsed config or null if not found
 */
export async function fetchPullPilotConfig(
    installationId: number,
    owner: string,
    repo: string,
    ref?: string
): Promise<PullPilotConfig | null> {
    try {
        const response = await getFileContent(
            installationId,
            owner,
            repo,
            CONFIG_FILENAME,
            ref
        );

        // GitHub returns base64 encoded content
        if (response && response.content) {
            const content = Buffer.from(response.content, 'base64').toString('utf-8');
            const config = parseConfig(content);
            console.log(`Loaded .pullpilot.yml from ${owner}/${repo}`);
            return config;
        }

        return null;
    } catch (error: any) {
        // 404 means config file doesn't exist - that's okay
        if (error.message?.includes('404') || error.message?.includes('Not Found')) {
            console.log(`No .pullpilot.yml found in ${owner}/${repo}`);
            return null;
        }

        // Log other errors but don't fail the review
        console.error(`Error fetching .pullpilot.yml from ${owner}/${repo}:`, error);
        return null;
    }
}

/**
 * Check if a repository has a .pullpilot.yml config
 */
export async function hasCustomRulesConfig(
    installationId: number,
    owner: string,
    repo: string
): Promise<boolean> {
    const config = await fetchPullPilotConfig(installationId, owner, repo);
    return config !== null;
}
