import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
    getFixSuggestionWithRepo,
    markFixApplied,
} from '@/lib/repositories';
import {
    canUserApplyFix,
    postFixSuggestionComment,
    getPRHeadSha,
} from '@/lib/github-app';

/**
 * Apply a fix suggestion to a PR using GitHub's suggestion comment feature
 * 
 * This approach:
 * - Works for fork PRs without needing app installation on the fork
 * - Shows the fix as a reviewable suggestion in the PR
 * - PR author can apply with one click using GitHub's built-in "Apply suggestion" button
 * 
 * GET /api/github/apply-fix?id={fixId}
 * 
 * Authorization: Only PR author or repo maintainers can post suggestions
 */
export async function GET(request: NextRequest) {
    try {
        // Get fix ID from query params
        const fixId = request.nextUrl.searchParams.get('id');

        if (!fixId) {
            return NextResponse.json(
                { error: 'Missing fix ID' },
                { status: 400 }
            );
        }

        // Get session (user must be logged in)
        const session = await getServerSession(authOptions);

        // Use username (GitHub login) for authorization - NOT name (display name)
        const username = (session?.user as any)?.username || session?.user?.name;

        if (!username) {
            // Redirect to login with callback to this URL
            const loginUrl = new URL('/api/auth/signin', request.url);
            loginUrl.searchParams.set('callbackUrl', request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Get fix details with repository info
        const fixData = await getFixSuggestionWithRepo(fixId);

        if (!fixData) {
            return NextResponse.json(
                { error: 'Fix suggestion not found' },
                { status: 404 }
            );
        }

        const { fix, repository, installation } = fixData;

        // Check if already applied
        if (fix.status === 'applied') {
            return NextResponse.json(
                {
                    error: 'This fix has already been applied',
                    prUrl: `https://github.com/${repository.repo_full_name}/pull/${fix.pr_number}`
                },
                { status: 400 }
            );
        }

        // Log details for debugging
        console.log('Apply fix request:', {
            fixId,
            username,
            prAuthor: fix.pr_author,
            owner: repository.owner_login,
            repo: repository.repo_name,
            prNumber: fix.pr_number,
            filePath: fix.file_path,
            lineNumber: fix.line_number,
            installationId: installation.installation_id
        });

        // Check authorization: user must be PR author or have write access
        const canApply = await canUserApplyFix(
            installation.installation_id,
            repository.owner_login,
            repository.repo_name,
            username,
            fix.pr_author
        );

        console.log('Authorization result:', { canApply, username, prAuthor: fix.pr_author });

        if (!canApply) {
            return NextResponse.json(
                {
                    error: 'Unauthorized. Only the PR author or repository maintainers can apply fixes.',
                    details: {
                        user: username,
                        prAuthor: fix.pr_author,
                        owner: repository.owner_login,
                        repo: repository.repo_name,
                    }
                },
                { status: 403 }
            );
        }

        // Get the latest commit SHA for the PR (needed for suggestion comments)
        const headSha = await getPRHeadSha(
            installation.installation_id,
            repository.owner_login,
            repository.repo_name,
            fix.pr_number
        );

        if (!headSha) {
            return NextResponse.json(
                { error: 'Could not get PR head commit. The PR may have been closed.' },
                { status: 400 }
            );
        }

        // Post a suggestion comment on the PR
        console.log('Posting suggestion comment:', fix.file_path, '@', fix.line_number);
        const result = await postFixSuggestionComment(
            installation.installation_id,
            repository.owner_login,
            repository.repo_name,
            fix.pr_number,
            headSha,
            fix.file_path,
            fix.line_number,
            fix.fix_type,
            fix.original_content,
            fix.replacement_content,
            fix.description
        );

        console.log('Post suggestion result:', result);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to post suggestion' },
                { status: 500 }
            );
        }

        // Mark fix as applied in database (applied = suggestion posted)
        await markFixApplied(fixId, `suggestion-${result.commentId}`, username);

        // Return success response
        const prUrl = `https://github.com/${repository.repo_full_name}/pull/${fix.pr_number}`;

        // Check if this is an API request or browser request
        const accept = request.headers.get('accept') || '';
        if (accept.includes('application/json')) {
            return NextResponse.json({
                success: true,
                message: 'Fix suggestion posted! Click "Apply suggestion" in the PR to apply.',
                commentId: result.commentId,
                prUrl,
            });
        }

        // For browser requests, redirect to PR
        return NextResponse.redirect(prUrl);

    } catch (error: any) {
        console.error('Error applying fix:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Also support POST for explicit form submissions
export async function POST(request: NextRequest) {
    return GET(request);
}
