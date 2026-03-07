import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/repositories', () => ({
    getFixSuggestionWithRepo: vi.fn(),
}));

import { getFixSuggestionWithRepo } from '@/lib/repositories';
import { GET } from '../route';

function makeRequest(id?: string): NextRequest {
    const url = id
        ? `http://localhost/api/github/fix-details?id=${id}`
        : 'http://localhost/api/github/fix-details';
    return new NextRequest(url);
}

const MOCK_FIX = {
    id: 'fix-uuid',
    fix_type: 'replace_line',
    file_path: 'src/utils.ts',
    line_number: 42,
    description: 'Remove console.log',
    pr_number: 7,
    pr_author: 'dev',
    status: 'pending',
    confidence: 0.95,
    category: 'console_logs',
    original_content: 'console.log(x);',
    replacement_content: null,
    created_at: '2026-03-01T00:00:00Z',
};

const MOCK_REPO = { repo_full_name: 'user/my-repo' };

describe('GET /api/github/fix-details', () => {
    beforeEach(() => vi.resetAllMocks());

    it('returns 400 when the id query param is missing', async () => {
        const res = await GET(makeRequest());
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toMatch(/missing fix id/i);
    });

    it('returns 404 when the fix is not found', async () => {
        vi.mocked(getFixSuggestionWithRepo).mockResolvedValue(null);
        const res = await GET(makeRequest('nonexistent-id'));
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.error).toMatch(/not found/i);
    });

    it('returns 200 with the correct fix shape when found', async () => {
        vi.mocked(getFixSuggestionWithRepo).mockResolvedValue({
            fix: MOCK_FIX,
            repository: MOCK_REPO,
        } as any);

        const res = await GET(makeRequest('fix-uuid'));
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.fix).toBeDefined();
        expect(json.fix.id).toBe('fix-uuid');
        expect(json.fix.file_path).toBe('src/utils.ts');
        expect(json.fix.repo_full_name).toBe('user/my-repo');
        expect(json.fix.confidence).toBe(0.95);
    });

    it('returns 500 when the repository call throws', async () => {
        vi.mocked(getFixSuggestionWithRepo).mockRejectedValue(new Error('DB connection failed'));
        const res = await GET(makeRequest('fix-uuid'));
        expect(res.status).toBe(500);
    });
});
