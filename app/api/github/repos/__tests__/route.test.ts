import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
    authOptions: {},
}));

vi.mock('@/lib/github-fetch', () => ({
    githubFetch: vi.fn(),
}));

import { getServerSession } from 'next-auth';
import { githubFetch } from '@/lib/github-fetch';
import { GET } from '../route';

const MOCK_REPOS = [
    { id: 1, full_name: 'user/repo-a', private: false },
    { id: 2, full_name: 'user/repo-b', private: true },
];

describe('GET /api/github/repos', () => {
    beforeEach(() => vi.resetAllMocks());

    it('returns 401 when there is no session', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null);
        const res = await GET();
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe('Unauthorized');
    });

    it('returns 401 when session has no access token', async () => {
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as any);
        const res = await GET();
        expect(res.status).toBe(401);
    });

    it('returns 200 with repo list on success', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            accessToken: 'gho_valid_token',
            user: { id: 'u1' },
        } as any);
        vi.mocked(githubFetch).mockResolvedValue(MOCK_REPOS);

        const res = await GET();
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toHaveLength(2);
        expect(json[0].full_name).toBe('user/repo-a');
        // Verify correct endpoint was called
        expect(githubFetch).toHaveBeenCalledWith(expect.objectContaining({
            endpoint: expect.stringContaining('/user/repos'),
        }));
    });

    it('returns 500 when GitHub API throws', async () => {
        vi.mocked(getServerSession).mockResolvedValue({
            accessToken: 'gho_token',
            user: { id: 'u1' },
        } as any);
        vi.mocked(githubFetch).mockRejectedValue(new Error('GitHub API rate limit exceeded'));

        const res = await GET();
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.error).toBe('Unexpected error');
        expect(json.detail).toContain('rate limit');
    });
});
