import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom, setFromQueue } = vi.hoisted(() => {
    let queue: any[] = [];
    const makeBuilder = (result: { data: any; error: any }) => {
        const builder: any = {
            select: vi.fn(),
            eq: vi.fn(),
            in: vi.fn(),
            maybeSingle: vi.fn().mockResolvedValue(result),
            limit: vi.fn(),
            then: (resolve: any) => Promise.resolve(result).then(resolve),
        };
        builder.select.mockReturnValue(builder);
        builder.eq.mockReturnValue(builder);
        builder.in.mockReturnValue(builder);
        builder.limit.mockReturnValue({ ...builder, then: (r: any) => Promise.resolve(result).then(r) });
        return builder;
    };
    const mockFrom = vi.fn(() => queue.shift() ?? makeBuilder({ data: [], error: null }));
    return { mockFrom, setFromQueue: (q: any[]) => { queue = q; }, makeBuilder };
});

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));
vi.mock('@/lib/repositories', () => ({ getRepositorySecuritySummary: vi.fn() }));

import { getServerSession } from 'next-auth';
import { getRepositorySecuritySummary } from '@/lib/repositories';
import { GET } from '../route';

// Re-create makeBuilder for test use (mirror of the hoisted one)
const makeBuilder = (result: { data: any; error: any }) => {
    const b: any = {
        select: vi.fn(), eq: vi.fn(), in: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue(result),
        limit: vi.fn(),
        then: (resolve: any) => Promise.resolve(result).then(resolve),
    };
    b.select.mockReturnValue(b); b.eq.mockReturnValue(b); b.in.mockReturnValue(b);
    b.limit.mockReturnValue({ ...b, then: (r: any) => Promise.resolve(result).then(r) });
    return b;
};

function makeRequest(repoId?: string): Request {
    const url = repoId
        ? `http://localhost/api/github/security?repoId=${repoId}`
        : 'http://localhost/api/github/security';
    return new Request(url);
}

const MOCK_SECURITY_DATA = {
    recentFindings: [{ ruleId: 'SEC001', severity: 'critical', file: 'src/config.ts' }],
    bySeverity: { critical: 1, high: 0, medium: 0, low: 0, total: 1 },
    byCategory: { secrets: 1 },
};

describe('GET /api/github/security', () => {
    beforeEach(() => {
        vi.mocked(getServerSession).mockReset();
        vi.mocked(getRepositorySecuritySummary).mockReset();
        mockFrom.mockClear();
        setFromQueue([]);
    });

    it('returns 401 when there is no session', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null);
        expect((await GET(makeRequest('1'))).status).toBe(401);
    });

    it('returns 400 when repoId param is missing', async () => {
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as any);
        const res = await GET(makeRequest());
        expect(res.status).toBe(400);
        expect((await res.json()).error).toMatch(/repoId is required/i);
    });

    it('returns 200 with empty findings when user has no installations', async () => {
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as any);
        setFromQueue([makeBuilder({ data: [], error: null })]);
        const res = await GET(makeRequest('42'));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.findings).toEqual([]);
        expect(json.summary.total).toBe(0);
    });

    it('returns 404 when the repository is not found', async () => {
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as any);
        setFromQueue([
            makeBuilder({ data: [{ id: 'inst-1' }], error: null }),
            makeBuilder({ data: null, error: null }),
        ]);
        const res = await GET(makeRequest('99999'));
        expect(res.status).toBe(404);
        expect((await res.json()).error).toMatch(/not found/i);
    });

    it('returns 200 with security findings for a valid request', async () => {
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as any);
        setFromQueue([
            makeBuilder({ data: [{ id: 'inst-1' }], error: null }),
            makeBuilder({ data: { id: 'repo-uuid', installation_id: 'inst-1' }, error: null }),
        ]);
        vi.mocked(getRepositorySecuritySummary).mockResolvedValue(MOCK_SECURITY_DATA as any);
        const res = await GET(makeRequest('101'));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.findings).toHaveLength(1);
        expect(json.findings[0].ruleId).toBe('SEC001');
        expect(json.summary.critical).toBe(1);
        expect(getRepositorySecuritySummary).toHaveBeenCalledWith('repo-uuid');
    });

    it('returns 500 when Supabase returns an error', async () => {
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as any);
        setFromQueue([makeBuilder({ data: null, error: new Error('Supabase down') })]);
        const res = await GET(makeRequest('101'));
        expect(res.status).toBe(500);
    });
});
