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

    // URL encode the path (but not the slashes)
    const encodedPath = path.split('/').map(segment => encodeURIComponent(segment)).join('/');

    const endpoint = ref
        ? `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`
        : `/repos/${owner}/${repo}/contents/${encodedPath}`;

    console.log(`GitHub getFileContent: ${endpoint}`);

    return await githubFetch({
        accessToken: token,
        endpoint,
    });
}

/**
 * Add labels to an issue/PR
 */
export async function addLabelsToIssue(
    installationId: number,
    owner: string,
    repo: string,
    issueNumber: number,
    labels: string[]
): Promise<void> {
    if (labels.length === 0) return;

    const token = await getInstallationAccessToken(installationId);

    try {
        await githubFetch({
            accessToken: token,
            endpoint: `/repos/${owner}/${repo}/issues/${issueNumber}/labels`,
            method: 'POST',
            body: { labels },
        });
        console.log(`Applied labels to #${issueNumber}:`, labels);
    } catch (error) {
        console.error('Error adding labels:', error);
        // Don't throw - labels are not critical
    }
}

export async function createLabel(
    installationId: number,
    owner: string,
    repo: string,
    name: string,
    color: string,
    description?: string
): Promise<boolean> {
    const token = await getInstallationAccessToken(installationId);

    try {
        await githubFetch({
            accessToken: token,
            endpoint: `/repos/${owner}/${repo}/labels`,
            method: 'POST',
            body: { name, color, description },
        });
        console.log(`Created label "${name}" in ${owner}/${repo}`);
        return true;
    } catch (error: any) {
        // Label might already exist (422 error)
        if (error.message?.includes('422') || error.message?.includes('already_exists')) {
            return true;
        }
        console.error('Error creating label:', error);
        return false;
    }
}

// ========== AUTO-FIX RELATED FUNCTIONS ==========

/**
 * Get user's permission level for a repository
 * Returns: 'admin' | 'write' | 'read' | 'none'
 */
export async function getUserRepoPermission(
    installationId: number,
    owner: string,
    repo: string,
    username: string
): Promise<'admin' | 'write' | 'read' | 'none'> {
    const token = await getInstallationAccessToken(installationId);

    try {
        const data = await githubFetch({
            accessToken: token,
            endpoint: `/repos/${owner}/${repo}/collaborators/${username}/permission`,
        });
        return data.permission || 'none';
    } catch (error) {
        console.error('Error checking user permission:', error);
        return 'none';
    }
}

/**
 * Check if user can apply fixes (is PR author or has write access)
 */
export async function canUserApplyFix(
    installationId: number,
    owner: string,
    repo: string,
    username: string,
    prAuthor: string
): Promise<boolean> {
    // PR author can always apply fixes
    if (username.toLowerCase() === prAuthor.toLowerCase()) {
        return true;
    }

    // Check if user has write or admin access
    const permission = await getUserRepoPermission(installationId, owner, repo, username);
    return permission === 'admin' || permission === 'write';
}

/**
 * Get the SHA of a file (needed to update it)
 */
export async function getFileSha(
    installationId: number,
    owner: string,
    repo: string,
    path: string,
    ref: string
): Promise<string | null> {
    try {
        const content = await getFileContent(installationId, owner, repo, path, ref);
        return content.sha || null;
    } catch (error) {
        console.error('Error getting file SHA:', error);
        return null;
    }
}

/**
 * Update a file in the repository (creates a commit)
 */
export async function updateFile(
    installationId: number,
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    sha: string
): Promise<{ commitSha: string }> {
    const token = await getInstallationAccessToken(installationId);

    // Content must be base64 encoded
    const encodedContent = Buffer.from(content).toString('base64');

    const data = await githubFetch({
        accessToken: token,
        endpoint: `/repos/${owner}/${repo}/contents/${path}`,
        method: 'PUT',
        body: {
            message,
            content: encodedContent,
            branch,
            sha,
        },
    });

    return {
        commitSha: data.commit?.sha || '',
    };
}

/**
 * Get full file content decoded from base64
 */
export async function getFileContentDecoded(
    installationId: number,
    owner: string,
    repo: string,
    path: string,
    ref: string
): Promise<{ content: string; sha: string } | null> {
    try {
        console.log(`Fetching file content: ${owner}/${repo}/${path} @ ${ref}`);
        const data = await getFileContent(installationId, owner, repo, path, ref);

        if (!data) {
            console.error('No data returned from getFileContent');
            return null;
        }

        if (!data.sha) {
            console.error('No SHA in file content response');
            return null;
        }

        // Handle files that don't have content (e.g., large files or directories)
        if (data.type === 'dir') {
            console.error('Path is a directory, not a file');
            return null;
        }

        if (!data.content) {
            // For large files, GitHub might not include content
            console.error('No content in file response. File might be too large or use LFS.');
            return null;
        }

        // Decode base64 content (GitHub returns with newlines which need to be removed)
        const cleanBase64 = data.content.replace(/\n/g, '');
        const content = Buffer.from(cleanBase64, 'base64').toString('utf8');

        console.log(`Successfully fetched file: ${path} (${content.length} chars)`);

        return {
            content,
            sha: data.sha,
        };
    } catch (error: any) {
        console.error('Error getting file content:', error?.message || error);
        return null;
    }
}

/**
 * Apply a fix by modifying a file and creating a commit
 */
export async function applyFixToFile(
    installationId: number,
    owner: string,
    repo: string,
    branch: string,
    filePath: string,
    lineNumber: number,
    fixType: 'remove_line' | 'replace_line' | 'insert_line',
    replacement: string | null,
    description: string
): Promise<{ success: boolean; commitSha?: string; error?: string }> {
    try {
        console.log(`Applying fix to ${owner}/${repo}:${branch} - ${filePath}:${lineNumber}`);
        console.log(`Fix type: ${fixType}, Description: ${description}`);

        // Get current file content
        const fileData = await getFileContentDecoded(installationId, owner, repo, filePath, branch);

        if (!fileData) {
            console.error(`Failed to get file content for: ${filePath} @ ${branch}`);

            // Check if it's a branch not found error (we caught this in the logs)
            return {
                success: false,
                error: `Could not read file content: ${filePath} @ ${branch}. The branch may have been deleted or the file no longer exists.`
            };
        }

        // Split into lines
        const lines = fileData.content.split('\n');

        // Validate line number
        if (lineNumber < 1 || lineNumber > lines.length) {
            return { success: false, error: 'Invalid line number' };
        }

        // Apply the fix
        const lineIndex = lineNumber - 1;

        switch (fixType) {
            case 'remove_line':
                lines.splice(lineIndex, 1);
                break;
            case 'replace_line':
                if (replacement !== null) {
                    lines[lineIndex] = replacement;
                }
                break;
            case 'insert_line':
                if (replacement !== null) {
                    lines.splice(lineIndex, 0, replacement);
                }
                break;
        }

        // Rejoin lines
        const newContent = lines.join('\n');

        // Create commit
        const commitMessage = `fix: ${description} (PullPilot auto-fix)

Applied automatic fix to ${filePath}:${lineNumber}`;

        const result = await updateFile(
            installationId,
            owner,
            repo,
            filePath,
            newContent,
            commitMessage,
            branch,
            fileData.sha
        );

        return {
            success: true,
            commitSha: result.commitSha,
        };
    } catch (error: any) {
        console.error('Error applying fix:', error);
        return {
            success: false,
            error: error.message || 'Failed to apply fix',
        };
    }
}
