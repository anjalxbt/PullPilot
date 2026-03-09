import { describe, it, expect, vi, beforeEach } from 'vitest';

// MUST be declared with vi.hoisted() — vi.mock factories are hoisted above all imports
const { mockFrom, getFromQueue, setFromQueue } = vi.hoisted(() => {
    let queue: any[] = [];
    const makeBuilder = (result: { data: any; error: any }) => {
        const builder: any = {
            select: vi.fn(),
            eq: vi.fn(),
            in: vi.fn(),
            order: vi.fn(),
            limit: vi.fn(),
            then: (resolve: any) => Promise.resolve(result).then(resolve),
        };
        builder.select.mockReturnValue(builder);
        builder.eq.mockReturnValue(builder);
        builder.in.mockReturnValue(builder);
        builder.order.mockReturnValue(builder);
        builder.limit.mockReturnValue({ ...builder, then: (r: any) => Promise.resolve(result).then(r) });
        return builder;
    };
    const mockFrom = vi.fn(() => {
        const next = queue.shift();
        return next ?? makeBuilder({ data: [], error: null });
    });
    return {
        mockFrom,
        getFromQueue: () => queue,
        setFromQueue: (q: any[]) => { queue = q; },
        makeBuilder,
    };
});

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { getServerSession } from 'next-auth';
import { GET } from '../route';

// Re-expose makeBuilder for tests (it was declared in hoisted scope)
const { makeBuilder } = vi.hoisted(() => {
    // This is a second hoisted block — safe to call vi.hoisted multiple times.
    // We return a standalone makeBuilder here for use in tests.
    const makeBuilder = (result: { data: any; error: any }) => {
        const builder: any = {
            select: vi.fn(),
            eq: vi.fn(),
            in: vi.fn(),
            order: vi.fn(),
            limit: vi.fn(),
            then: (resolve: any) => Promise.resolve(result).then(resolve),
        };
        builder.select.mockReturnValue(builder);
        builder.eq.mockReturnValue(builder);
        builder.in.mockReturnValue(builder);
        builder.order.mockReturnValue(builder);
        builder.limit.mockReturnValue({ ...builder, then: (r: any) => Promise.resolve(result).then(r) });
        return builder;
    };
    return { makeBuilder };
});

function makeRequest(repoId?: string): Request {
    const url = repoId
        ? `http://localhost/api/github/reviews?repoId=${repoId}`
        : 'http://localhost/api/github/reviews';
    return new Request(url);
}

describe('GET /api/github/reviews', () => {
    beforeEach(() => {
        vi.mocked(getServerSession).mockReset();
        mockFrom.mockClear();
        setFromQueue([]);
    });

    it('returns 401 when there is no session', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null);
        const res = await GET(makeRequest());
        expect(res.status).toBe(401);
        expect((await res.json()).error).toBe('Unauthorized');
    });

    it('returns 401 when session has no user id', async () => {
        vi.mocked(getServerSession).mockResolvedValue({ user: {} } as any);
        const res = await GET(makeRequest());
        expect(res.status).toBe(401);
    });

    it('returns 200 with empty array when user has no installations', async () => {
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as any);
        setFromQueue([makeBuilder({ data: [], error: null })]);
        const res = await GET(makeRequest());
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual([]);
    });

    it('returns 200 with all reviews when no repoId param', async () => {
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as any);
        setFromQueue([
            makeBuilder({ data: [{ id: 'inst-1' }], error: null }),
            makeBuilder({ data: [{ id: 'rev-1', pr_number: 5 }], error: null }),
        ]);
        const res = await GET(makeRequest());
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toHaveLength(1);
        expect(json[0].pr_number).toBe(5);
    });

    it('returns 200 with filtered reviews when repoId param is provided', async () => {
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as any);
        setFromQueue([
            makeBuilder({ data: [{ id: 'inst-1' }], error: null }),
            makeBuilder({ data: [{ id: 'rev-2', pr_number: 10 }], error: null }),
        ]);
        const res = await GET(makeRequest('999'));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json[0].pr_number).toBe(10);
    });

    it('returns 500 when Supabase returns an error', async () => {
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as any);
        setFromQueue([makeBuilder({ data: null, error: new Error('DB error') })]);
        const res = await GET(makeRequest());
        expect(res.status).toBe(500);
    });
});
