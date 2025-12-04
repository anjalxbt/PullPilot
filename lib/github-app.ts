import jwt from 'jsonwebtoken';
import { githubFetch } from './github-fetch';

/**
 * Generate a JWT for GitHub App authentication
 */
function generateAppJWT(): string {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

    if (!appId || !privateKey) {
        throw new Error('GitHub App credentials not configured');
    }

    // Decode base64 private key
    const decodedKey = Buffer.from(privateKey, 'base64').toString('utf8');

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iat: now - 60, // Issued at time (60 seconds in the past to account for clock drift)
        exp: now + 600, // Expiration time (10 minutes)
        iss: appId, // GitHub App ID
    };

    return jwt.sign(payload, decodedKey, { algorithm: 'RS256' });
}

/**
 * Get installation access token
 */
export async function getInstallationAccessToken(
    installationId: number
): Promise<string> {
    const appJWT = generateAppJWT();

    try {
        const response = await fetch(
            `https://api.github.com/app/installations/${installationId}/access_tokens`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${appJWT}`,
                    Accept: 'application/vnd.github+json',
                    'User-Agent': 'PullPilot-App',
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get installation token: ${error}`);
        }

        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Error getting installation access token:', error);
        throw error;
    }
}

/**
 * Get pull request details
 */
export async function getPullRequest(
    installationId: number,
    owner: string,
    repo: string,
    prNumber: number
) {
    const token = await getInstallationAccessToken(installationId);

    return await githubFetch({
        accessToken: token,
        endpoint: `/repos/${owner}/${repo}/pulls/${prNumber}`,
    });
}

/**
 * Get pull request files (diff)
 */
export async function getPullRequestFiles(
    installationId: number,
    owner: string,
    repo: string,
    prNumber: number
) {
    const token = await getInstallationAccessToken(installationId);

    return await githubFetch({
        accessToken: token,
        endpoint: `/repos/${owner}/${repo}/pulls/${prNumber}/files`,
    });
}

/**
 * Get pull request diff
 */
export async function getPullRequestDiff(
    installationId: number,
    owner: string,
    repo: string,
    prNumber: number
): Promise<string> {
    const token = await getInstallationAccessToken(installationId);

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3.diff',
                    'User-Agent': 'PullPilot-App',
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch diff: ${response.statusText}`);
        }

        return await response.text();
    } catch (error) {
        console.error('Error fetching PR diff:', error);
        throw error;
    }
}

/**
 * Post a comment on a pull request
 */
export async function postPRComment(
    installationId: number,
    owner: string,
    repo: string,
    prNumber: number,
    body: string
) {
    const token = await getInstallationAccessToken(installationId);

    return await githubFetch({
        accessToken: token,
        endpoint: `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
        method: 'POST',
        body: { body },
    });
}

/**
 * Get installation repositories
 */
export async function getInstallationRepos(installationId: number) {
    const token = await getInstallationAccessToken(installationId);

    return await githubFetch({
        accessToken: token,
        endpoint: `/installation/repositories`,
    });
}

/**
 * Get file content from repository
 */
export async function getFileContent(
    installationId: number,
    owner: string,
    repo: string,
    path: string,
    ref?: string
) {
    const token = await getInstallationAccessToken(installationId);

    const endpoint = ref
        ? `/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
        : `/repos/${owner}/${repo}/contents/${path}`;

    return await githubFetch({
        accessToken: token,
        endpoint,
    });
}
