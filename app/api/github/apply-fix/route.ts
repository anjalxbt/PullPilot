import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
    getFixSuggestionWithRepo,
    markFixApplied,
} from '@/lib/repositories';
import {
    canUserApplyFix,
    applyFixToFile,
    postPRComment,
} from '@/lib/github-app';

/**
 * Apply a fix suggestion to a PR
 * 
 * GET /api/github/apply-fix?id={fixId}
 * 
 * Authorization: Only PR author or repo maintainers can apply fixes
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

        if (!session?.user?.name) {
            // Redirect to login with callback to this URL
            const loginUrl = new URL('/api/auth/signin', request.url);
            loginUrl.searchParams.set('callbackUrl', request.url);
            return NextResponse.redirect(loginUrl);
        }

        const username = session.user.name;

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
                { error: 'Fix has already been applied', commitSha: fix.commit_sha },
                { status: 409 }
            );
        }

        // Check if expired or dismissed
        if (fix.status !== 'pending') {
            return NextResponse.json(
                { error: `Fix is ${fix.status}` },
                { status: 410 }
            );
        }

        // Check authorization: user must be PR author or have write access
        const canApply = await canUserApplyFix(
            installation.installation_id,
            repository.owner_login,
            repository.repo_name,
            username,
            fix.pr_author
        );

        if (!canApply) {
            return NextResponse.json(
                {
                    error: 'Unauthorized. Only the PR author or repository maintainers can apply fixes.',
                    details: {
                        user: username,
                        prAuthor: fix.pr_author,
                    }
                },
                { status: 403 }
            );
        }

        // Apply the fix
        const result = await applyFixToFile(
            installation.installation_id,
            repository.owner_login,
            repository.repo_name,
            fix.pr_branch,
            fix.file_path,
            fix.line_number,
            fix.fix_type,
            fix.replacement_content,
            fix.description
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to apply fix' },
                { status: 500 }
            );
        }

        // Mark fix as applied in database
        await markFixApplied(fixId, result.commitSha!, username);

        // Post a comment on the PR
        await postPRComment(
            installation.installation_id,
            repository.owner_login,
            repository.repo_name,
            fix.pr_number,
            `✅ **Auto-fix applied** by @${username}\n\n` +
            `**Fix:** ${fix.description}\n` +
            `**File:** \`${fix.file_path}\`\n` +
            `**Commit:** ${result.commitSha}`
        );

        // Return success response (redirect to PR for web users)
        const prUrl = `https://github.com/${repository.repo_full_name}/pull/${fix.pr_number}`;

        // Check if this is an API request or browser request
        const accept = request.headers.get('accept') || '';
        if (accept.includes('application/json')) {
            return NextResponse.json({
                success: true,
                message: 'Fix applied successfully',
                commitSha: result.commitSha,
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

/**
 * POST endpoint for API-style requests
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const fixId = body.fixId || body.id;

        if (!fixId) {
            return NextResponse.json(
                { error: 'Missing fixId in request body' },
                { status: 400 }
            );
        }

        // Create a URL with the fix ID and call GET handler logic
        const url = new URL(request.url);
        url.searchParams.set('id', fixId);

        // Reuse GET logic by creating a new request
        const getRequest = new NextRequest(url, {
            headers: request.headers,
        });

        return GET(getRequest);

    } catch (error: any) {
        console.error('Error in POST apply-fix:', error);
        return NextResponse.json(
            { error: error.message || 'Invalid request' },
            { status: 400 }
        );
    }
}
