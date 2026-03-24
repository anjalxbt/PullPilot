import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

// ── Mock all external dependencies ───────────────────────────
vi.mock('@/lib/webhook-verify', () => ({
    verifyWebhookSignature: vi.fn(),
}));

vi.mock('@/lib/repositories', () => ({
    getInstallationById: vi.fn(),
    getRepositoryByRepoId: vi.fn(),
    storeRepository: vi.fn(),
    storePRReview: vi.fn(),
    storeSecurityFindings: vi.fn(),
    updateReviewSecuritySummary: vi.fn(),
    storeFixSuggestions: vi.fn(),
}));

vi.mock('@/lib/github-app', () => ({
    getPullRequest: vi.fn(),
    getPullRequestFiles: vi.fn(),
    getPullRequestDiff: vi.fn(),
    postPRComment: vi.fn(),
    postSecurityReviewComments: vi.fn(),
    getPRHeadSha: vi.fn(),
    addLabelsToIssue: vi.fn(),
    createLabel: vi.fn(),
}));

vi.mock('@/lib/ai-reviewer', () => ({
    analyzePullRequest: vi.fn(),
    formatReviewComment: vi.fn(),
}));

vi.mock('@/lib/rules-fetcher', () => ({
    fetchPullPilotConfig: vi.fn(),
}));

vi.mock('@/lib/rules-engine', () => ({
    evaluateRules: vi.fn(),
    formatRulesComment: vi.fn(),
}));

// ── Import mocks & route AFTER vi.mock() declarations ─────────
import { verifyWebhookSignature } from '@/lib/webhook-verify';
import {
    getInstallationById,
    getRepositoryByRepoId,
    storeRepository,
    storePRReview,
    storeSecurityFindings,
    updateReviewSecuritySummary,
    storeFixSuggestions,
} from '@/lib/repositories';
import {
    getPullRequest,
    getPullRequestFiles,
    getPullRequestDiff,
    postPRComment,
    postSecurityReviewComments,
    getPRHeadSha,
    addLabelsToIssue,
    createLabel,
} from '@/lib/github-app';
import { analyzePullRequest, formatReviewComment } from '@/lib/ai-reviewer';
import { fetchPullPilotConfig } from '@/lib/rules-fetcher';
import { evaluateRules, formatRulesComment } from '@/lib/rules-engine';
import { POST } from '../route';

// ── Helpers ───────────────────────────────────────────────────
const WEBHOOK_SECRET = 'test-webhook-secret';

function sign(body: string): string {
    return 'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
}

function makeRequest(body: object, event: string, signatureOverride?: string): NextRequest {
    const raw = JSON.stringify(body);
    const sig = signatureOverride ?? sign(raw);
    return new NextRequest('http://localhost/api/webhooks/github', {
        method: 'POST',
        body: raw,
        headers: {
            'content-type': 'application/json',
            'x-hub-signature-256': sig,
            'x-github-event': event,
        },
    });
}

const REPO_PAYLOAD = {
    id: 101,
    name: 'my-repo',
    full_name: 'user/my-repo',
    private: false,
    default_branch: 'main',
    owner: { login: 'user' },
};

const PR_PAYLOAD = {
    number: 7,
    title: 'Great PR',
    body: 'description',
    draft: false,
    user: { login: 'contributor' },
    head: { ref: 'feat/thing', repo: { owner: { login: 'user' }, name: 'my-repo' }, sha: 'abc123' },
    requested_reviewers: [],
};

const INSTALLATION_PAYLOAD = { id: 42, account: { login: 'user' } };

// ── Tests ─────────────────────────────────────────────────────
describe('POST /api/webhooks/github', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetAllMocks();
        process.env = { ...originalEnv, GITHUB_APP_WEBHOOK_SECRET: WEBHOOK_SECRET };
        // Default: signature valid
        vi.mocked(verifyWebhookSignature).mockReturnValue(true);
    });

    // ── Auth / config guards ──────────────────────────────────
    it('returns 500 when webhook secret is not configured', async () => {
        delete process.env.GITHUB_APP_WEBHOOK_SECRET;
        const req = makeRequest({}, 'ping', 'sha256=fakesig');
        const res = await POST(req);
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.error).toMatch(/not configured/i);
    });

    it('returns 401 when signature is invalid', async () => {
        vi.mocked(verifyWebhookSignature).mockReturnValue(false);
        const req = makeRequest({}, 'ping', 'sha256=badsig');
        const res = await POST(req);
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toMatch(/invalid signature/i);
    });

    // ── Unknown / unhandled events ────────────────────────────
    it('returns 200 for an unhandled event type', async () => {
        const req = makeRequest({ zen: 'test' }, 'ping');
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.message).toBe('Event received');
    });

    // ── installation event ────────────────────────────────────
    it('returns 200 for installation.created event', async () => {
        const req = makeRequest({ action: 'created', installation: INSTALLATION_PAYLOAD }, 'installation');
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.message).toContain('Installation event processed');
    });

    it('returns 200 for installation.deleted event', async () => {
        const req = makeRequest({ action: 'deleted', installation: INSTALLATION_PAYLOAD }, 'installation');
        const res = await POST(req);
        expect(res.status).toBe(200);
    });

    // ── installation_repositories event ──────────────────────
    it('returns 404 when installation not found for installation_repositories event', async () => {
        vi.mocked(getInstallationById).mockResolvedValue(null);
        const req = makeRequest({
            action: 'added',
            installation: INSTALLATION_PAYLOAD,
            repositories_added: [{ id: 1, name: 'r', full_name: 'u/r', private: false }],
            repositories_removed: [],
        }, 'installation_repositories');
        const res = await POST(req);
        expect(res.status).toBe(404);
    });

    it('returns 200 and stores repos for installation_repositories event', async () => {
        vi.mocked(getInstallationById).mockResolvedValue({ id: 'db-inst-uuid' } as any);
        vi.mocked(storeRepository).mockResolvedValue({} as any);
        const req = makeRequest({
            action: 'added',
            installation: INSTALLATION_PAYLOAD,
            repositories_added: [{ id: 1, name: 'new-repo', full_name: 'user/new-repo', private: false }],
            repositories_removed: [],
        }, 'installation_repositories');
        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(storeRepository).toHaveBeenCalledOnce();
    });

    // ── pull_request event – guards ───────────────────────────
    it('returns 200 for pull_request.closed (not processed)', async () => {
        const req = makeRequest({
            action: 'closed',
            pull_request: PR_PAYLOAD,
            repository: REPO_PAYLOAD,
            installation: INSTALLATION_PAYLOAD,
        }, 'pull_request');
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.message).toBe('Action not processed');
    });

    it('returns 400 when pull_request payload has no installation', async () => {
        const req = makeRequest({
            action: 'opened',
            pull_request: PR_PAYLOAD,
            repository: REPO_PAYLOAD,
            // no installation key
        }, 'pull_request');
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('returns 404 when installation is not found in database', async () => {
        vi.mocked(getRepositoryByRepoId).mockResolvedValue(null);
        vi.mocked(getInstallationById).mockResolvedValue(null);
        const req = makeRequest({
            action: 'opened',
            pull_request: PR_PAYLOAD,
            repository: REPO_PAYLOAD,
            installation: INSTALLATION_PAYLOAD,
        }, 'pull_request');
        const res = await POST(req);
        expect(res.status).toBe(404);
    });

    // ── pull_request happy path ───────────────────────────────
    it('returns 200 with review summary on successful PR review', async () => {
        // Repo already in DB
        vi.mocked(getRepositoryByRepoId).mockResolvedValue({ id: 'repo-uuid' } as any);

        // GitHub API mocks
        vi.mocked(getPullRequest).mockResolvedValue({ additions: 20, deletions: 5 } as any);
        vi.mocked(getPullRequestFiles).mockResolvedValue([
            { filename: 'src/auth.ts', status: 'modified', additions: 20, deletions: 5, changes: 25 },
        ] as any);
        vi.mocked(getPullRequestDiff).mockResolvedValue('diff --git a/src/auth.ts...');
        vi.mocked(fetchPullPilotConfig).mockResolvedValue(null); // no custom config
        vi.mocked(getPRHeadSha).mockResolvedValue('abc123sha');
        vi.mocked(postPRComment).mockResolvedValue(undefined);
        vi.mocked(addLabelsToIssue).mockResolvedValue(undefined);
        vi.mocked(createLabel).mockResolvedValue(true);

        // AI review mock
        vi.mocked(analyzePullRequest).mockResolvedValue({
            summary: 'Looks good',
            aiModel: 'groq',
            securityScan: { findings: [], summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 } },
            fixSuggestions: [],
            suggestedLabels: [{ label: 'enhancement', confidence: 0.9, reason: 'refactor' }],
        } as any);
        vi.mocked(formatReviewComment).mockReturnValue('## Review\nLooks good');
        vi.mocked(storePRReview).mockResolvedValue({ id: 'review-uuid' } as any);

        const req = makeRequest({
            action: 'opened',
            pull_request: PR_PAYLOAD,
            repository: REPO_PAYLOAD,
            installation: INSTALLATION_PAYLOAD,
        }, 'pull_request');

        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.message).toBe('PR reviewed successfully');
        expect(json.pr_number).toBe(7);
        expect(json.labels_applied).toContain('enhancement');
        expect(json.security_findings).toBe(0);
        // Verify side effects
        expect(postPRComment).toHaveBeenCalledOnce();
        expect(storePRReview).toHaveBeenCalledOnce();
        expect(createLabel).toHaveBeenCalledOnce();
        expect(addLabelsToIssue).toHaveBeenCalledOnce();
        expect(storeSecurityFindings).not.toHaveBeenCalled();
    });

    it('handles pull_request.synchronize the same as opened', async () => {
        vi.mocked(getRepositoryByRepoId).mockResolvedValue({ id: 'repo-uuid' } as any);
        vi.mocked(getPullRequest).mockResolvedValue({ additions: 5, deletions: 2 } as any);
        vi.mocked(getPullRequestFiles).mockResolvedValue([] as any);
        vi.mocked(getPullRequestDiff).mockResolvedValue('');
        vi.mocked(fetchPullPilotConfig).mockResolvedValue(null);
        vi.mocked(getPRHeadSha).mockResolvedValue('sha999');
        vi.mocked(postPRComment).mockResolvedValue(undefined);
        vi.mocked(analyzePullRequest).mockResolvedValue({
            summary: 'ok', aiModel: 'groq',
            securityScan: { findings: [], summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 } },
            fixSuggestions: [],
            suggestedLabels: [],
        } as any);
        vi.mocked(formatReviewComment).mockReturnValue('');
        vi.mocked(storePRReview).mockResolvedValue({ id: 'review-uuid' } as any);

        const req = makeRequest({
            action: 'synchronize',
            pull_request: PR_PAYLOAD,
            repository: REPO_PAYLOAD,
            installation: INSTALLATION_PAYLOAD,
        }, 'pull_request');

        const res = await POST(req);
        expect(res.status).toBe(200);
        expect((await res.json()).message).toBe('PR reviewed successfully');
    });

    it('stores security findings and posts inline comments when scan has results', async () => {
        vi.mocked(getRepositoryByRepoId).mockResolvedValue({ id: 'repo-uuid' } as any);
        vi.mocked(getPullRequest).mockResolvedValue({ additions: 10, deletions: 0 } as any);
        vi.mocked(getPullRequestFiles).mockResolvedValue([] as any);
        vi.mocked(getPullRequestDiff).mockResolvedValue('');
        vi.mocked(fetchPullPilotConfig).mockResolvedValue(null);
        vi.mocked(getPRHeadSha).mockResolvedValue('deadbeef');
        vi.mocked(postPRComment).mockResolvedValue(undefined);
        vi.mocked(postSecurityReviewComments).mockResolvedValue({ success: true } as any);
        vi.mocked(storeSecurityFindings).mockResolvedValue(undefined);
        vi.mocked(updateReviewSecuritySummary).mockResolvedValue(undefined);

        const mockFinding = {
            ruleId: 'SEC001', ruleName: 'Hardcoded API Key',
            severity: 'critical', category: 'secrets',
            message: 'API key found', file: 'src/config.ts', line: 1,
        };

        vi.mocked(analyzePullRequest).mockResolvedValue({
            summary: 'Issues found', aiModel: 'groq',
            securityScan: {
                findings: [mockFinding],
                summary: { critical: 1, high: 0, medium: 0, low: 0, total: 1 },
            },
            fixSuggestions: [],
            suggestedLabels: [],
        } as any);
        vi.mocked(formatReviewComment).mockReturnValue('## Review');
        vi.mocked(storePRReview).mockResolvedValue({ id: 'review-uuid' } as any);

        const req = makeRequest({
            action: 'opened',
            pull_request: PR_PAYLOAD,
            repository: REPO_PAYLOAD,
            installation: INSTALLATION_PAYLOAD,
        }, 'pull_request');

        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.security_findings).toBe(1);
        expect(storeSecurityFindings).toHaveBeenCalledOnce();
        expect(updateReviewSecuritySummary).toHaveBeenCalledOnce();
        expect(postSecurityReviewComments).toHaveBeenCalledOnce();
    });
});
