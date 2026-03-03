import { NextRequest, NextResponse } from 'next/server';
import { getFixSuggestionWithRepo } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

/**
 * Get fix suggestion details
 * 
 * GET /api/github/fix-details?id={fixId}
 */
export async function GET(request: NextRequest) {
    try {
        const fixId = request.nextUrl.searchParams.get('id');

        if (!fixId) {
            return NextResponse.json(
                { error: 'Missing fix ID' },
                { status: 400 }
            );
        }

        const fixData = await getFixSuggestionWithRepo(fixId);

        if (!fixData) {
            return NextResponse.json(
                { error: 'Fix suggestion not found' },
                { status: 404 }
            );
        }

        const { fix, repository } = fixData;

        return NextResponse.json({
            fix: {
                id: fix.id,
                fix_type: fix.fix_type,
                file_path: fix.file_path,
                line_number: fix.line_number,
                description: fix.description,
                pr_number: fix.pr_number,
                pr_author: fix.pr_author,
                status: fix.status,
                confidence: fix.confidence,
                category: fix.category,
                original_content: fix.original_content,
                replacement_content: fix.replacement_content,
                created_at: fix.created_at,
                repo_full_name: repository.repo_full_name,
            },
        });

    } catch (error: any) {
        console.error('Error fetching fix details:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
