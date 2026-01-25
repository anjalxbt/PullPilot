import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repoIdParam = searchParams.get("repoId");

    try {
        // 1. Get user's installation IDs
        const { data: installations, error: instError } = await supabaseAdmin
            .from('github_installations')
            .select('id')
            .eq('user_id', session.user.id);

        if (instError) {
            console.error("Error fetching installations:", instError);
            throw instError;
        }

        const installationIds = installations.map(i => i.id);

        if (installationIds.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Fetch reviews for these installations
        let query = supabaseAdmin
            .from('pull_request_reviews')
            .select(`
        *,
        repositories!inner (
          id,
          repo_name,
          repo_full_name,
          owner_login,
          installation_id
        )
      `)
            .in('repositories.installation_id', installationIds)
            .order('review_posted_at', { ascending: false })
            .limit(50);

        if (repoIdParam) {
            query = query.eq('repo_id', repoIdParam);
        }

        const { data: reviews, error: reviewsError } = await query;

        if (reviewsError) {
            console.error("Error fetching reviews:", reviewsError);
            throw reviewsError;
        }

        return NextResponse.json(reviews);

    } catch (e: any) {
        console.error("API Error:", e);
        return NextResponse.json({
            error: "Internal Server Error",
            detail: e?.message || String(e)
        }, { status: 500 });
    }
}
