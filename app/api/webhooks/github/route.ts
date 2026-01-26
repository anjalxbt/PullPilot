import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/webhook-verify';
import {
    getInstallationById,
    getRepositoryByRepoId,
    storeRepository,
    storePRReview,
    storeSecurityFindings,
    updateReviewSecuritySummary,
} from '@/lib/repositories';
import {
    getPullRequest,
    getPullRequestFiles,
    getPullRequestDiff,
    postPRComment,
    addLabelsToIssue,
} from '@/lib/github-app';
import { analyzePullRequest, formatReviewComment } from '@/lib/ai-reviewer';

export async function POST(request: NextRequest) {
    try {
        // Get raw body for signature verification
        const body = await request.text();
        const signature = request.headers.get('x-hub-signature-256');
        const event = request.headers.get('x-github-event');

        // Verify webhook signature
        const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('Webhook secret not configured');
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            );
        }

        if (!signature || !verifyWebhookSignature(body, signature, webhookSecret)) {
            console.error('Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const payload = JSON.parse(body);

        // Handle different event types
        if (event === 'pull_request') {
            return await handlePullRequestEvent(payload);
        } else if (event === 'installation') {
            return await handleInstallationEvent(payload);
        } else if (event === 'installation_repositories') {
            return await handleInstallationRepositoriesEvent(payload);
        }

        // Acknowledge other events
        return NextResponse.json({ message: 'Event received' });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Handle pull_request events
 */
async function handlePullRequestEvent(payload: any) {
    const action = payload.action;

    // Only process opened, synchronize (new commits), and reopened events
    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
        return NextResponse.json({ message: 'Action not processed' });
    }

    const pullRequest = payload.pull_request;
    const repository = payload.repository;
    const installation = payload.installation;

    if (!installation) {
        console.error('No installation found in payload');
        return NextResponse.json({ error: 'No installation' }, { status: 400 });
    }

    try {
        // Get or create repository record
        let repoRecord = await getRepositoryByRepoId(repository.id);

        if (!repoRecord) {
            // Get installation from database
            const installationRecord = await getInstallationById(installation.id);

            if (!installationRecord) {
                console.error('Installation not found in database:', installation.id);
                return NextResponse.json(
                    { error: 'Installation not found' },
                    { status: 404 }
                );
            }

            // Store repository
            repoRecord = await storeRepository({
                installation_id: installationRecord.id,
                repo_id: repository.id,
                repo_name: repository.name,
                repo_full_name: repository.full_name,
                owner_login: repository.owner.login,
                is_private: repository.private,
                default_branch: repository.default_branch || 'main',
            });
        }

        // Fetch PR details and diff
        const [prDetails, prFiles, prDiff] = await Promise.all([
            getPullRequest(
                installation.id,
                repository.owner.login,
                repository.name,
                pullRequest.number
            ),
            getPullRequestFiles(
                installation.id,
                repository.owner.login,
                repository.name,
                pullRequest.number
            ),
            getPullRequestDiff(
                installation.id,
                repository.owner.login,
                repository.name,
                pullRequest.number
            ),
        ]);

        // Analyze PR with AI
        const review = await analyzePullRequest(
            pullRequest.title,
            pullRequest.body || '',
            prFiles,
            prDiff
        );

        // Format and post comment
        const comment = formatReviewComment(review);
        await postPRComment(
            installation.id,
            repository.owner.login,
            repository.name,
            pullRequest.number,
            comment
        );

        // Store review in database
        const prReview = await storePRReview({
            repository_id: repoRecord.id,
            pr_number: pullRequest.number,
            pr_title: pullRequest.title,
            pr_author: pullRequest.user.login,
            review_summary: review.summary,
            files_changed: prFiles.length,
            additions: prDetails.additions,
            deletions: prDetails.deletions,
            ai_model: review.aiModel,
        });

        // Store security findings if any
        if (review.securityScan && review.securityScan.findings.length > 0) {
            await storeSecurityFindings(prReview.id, review.securityScan.findings);
            await updateReviewSecuritySummary(prReview.id, review.securityScan.summary);
        }

        // Apply auto-labels (only high confidence)
        const labelsToApply = review.suggestedLabels
            .filter(l => l.confidence >= 0.7)
            .map(l => l.label);

        if (labelsToApply.length > 0) {
            await addLabelsToIssue(
                installation.id,
                repository.owner.login,
                repository.name,
                pullRequest.number,
                labelsToApply
            );
        }

        return NextResponse.json({
            message: 'PR reviewed successfully',
            pr_number: pullRequest.number,
            security_findings: review.securityScan?.summary.total || 0,
            labels_applied: labelsToApply,
        });
    } catch (error) {
        console.error('Error processing pull request:', error);
        return NextResponse.json(
            { error: 'Failed to process pull request' },
            { status: 500 }
        );
    }
}

/**
 * Handle installation events (created, deleted)
 */
async function handleInstallationEvent(payload: any) {
    const action = payload.action;
    const installation = payload.installation;

    console.log(`Installation ${action}:`, installation.id);

    // Note: Installation creation is handled via the OAuth callback
    // This webhook is mainly for logging and handling deletions

    if (action === 'deleted') {
        // You could delete the installation from the database here
        // For now, we'll just log it
        console.log('Installation deleted:', installation.id);
    }

    return NextResponse.json({ message: 'Installation event processed' });
}

/**
 * Handle installation_repositories events (added, removed)
 */
async function handleInstallationRepositoriesEvent(payload: any) {
    const action = payload.action;
    const installation = payload.installation;
    const repositoriesAdded = payload.repositories_added || [];
    const repositoriesRemoved = payload.repositories_removed || [];

    console.log(`Repositories ${action}:`, {
        installation: installation.id,
        added: repositoriesAdded.length,
        removed: repositoriesRemoved.length,
    });

    // Get installation from database
    const installationRecord = await getInstallationById(installation.id);

    if (!installationRecord) {
        console.error('Installation not found:', installation.id);
        return NextResponse.json(
            { error: 'Installation not found' },
            { status: 404 }
        );
    }

    // Store newly added repositories
    for (const repo of repositoriesAdded) {
        try {
            await storeRepository({
                installation_id: installationRecord.id,
                repo_id: repo.id,
                repo_name: repo.name,
                repo_full_name: repo.full_name,
                owner_login: installation.account.login,
                is_private: repo.private,
                default_branch: 'main', // Will be updated when we fetch full details
            });
        } catch (error) {
            console.error('Error storing repository:', error);
        }
    }

    return NextResponse.json({ message: 'Repository event processed' });
}
