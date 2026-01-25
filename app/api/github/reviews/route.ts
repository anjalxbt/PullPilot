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

    console.log("Fetching reviews for user:", session.user.id, "repoId:", repoIdParam);

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

        console.log("Found installations:", installations);

        const installationIds = installations.map(i => i.id);

        if (installationIds.length === 0) {
            console.log("No installations found, returning empty array");
            return NextResponse.json([]);
        }

        // 2. Build the query based on whether we have a repoId filter
        if (repoIdParam) {
            // Filter by specific repository using GitHub repo_id
            const { data: reviews, error: reviewsError } = await supabaseAdmin
                .from('pull_request_reviews')
                .select(`
                    *,
                    repositories!inner (
                        id,
                        repo_id,
                        repo_name,
                        repo_full_name,
                        owner_login,
                        installation_id
                    )
                `)
                .eq('repositories.repo_id', parseInt(repoIdParam, 10))
                .in('repositories.installation_id', installationIds)
                .order('review_posted_at', { ascending: false })
                .limit(50);

            if (reviewsError) {
                console.error("Error fetching reviews with repoId filter:", reviewsError);
                throw reviewsError;
            }

            console.log("Reviews found:", reviews?.length || 0);
            return NextResponse.json(reviews || []);
        } else {
            // Fetch all reviews for user's installations
            const { data: reviews, error: reviewsError } = await supabaseAdmin
                .from('pull_request_reviews')
                .select(`
                    *,
                    repositories!inner (
                        id,
                        repo_id,
                        repo_name,
                        repo_full_name,
                        owner_login,
                        installation_id
                    )
                `)
                .in('repositories.installation_id', installationIds)
                .order('review_posted_at', { ascending: false })
                .limit(50);

            if (reviewsError) {
                console.error("Error fetching all reviews:", reviewsError);
                throw reviewsError;
            }

            console.log("All reviews found:", reviews?.length || 0);
            return NextResponse.json(reviews || []);
        }

    } catch (e: any) {
        console.error("API Error:", e);
        return NextResponse.json({
            error: "Internal Server Error",
            detail: e?.message || String(e)
        }, { status: 500 });
    }
}

