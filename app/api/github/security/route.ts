import { authOptions } from "@/lib/auth";
import { getRepositorySecuritySummary } from "@/lib/repositories";
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

    if (!repoIdParam) {
        return NextResponse.json({ error: "repoId is required" }, { status: 400 });
    }

    try {
        // First verify user has access to this repo via their installations
        const { data: installations, error: instError } = await supabaseAdmin
            .from('github_installations')
            .select('id')
            .eq('user_id', session.user.id);

        if (instError) throw instError;

        const installationIds = installations?.map(i => i.id) || [];

        if (installationIds.length === 0) {
            return NextResponse.json({
                findings: [],
                summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
            });
        }

        // Find the repository by GitHub repo_id
        const { data: repo, error: repoError } = await supabaseAdmin
            .from('repositories')
            .select('id, installation_id')
            .eq('repo_id', parseInt(repoIdParam, 10))
            .in('installation_id', installationIds)
            .maybeSingle();

        if (repoError) throw repoError;

        if (!repo) {
            return NextResponse.json({ error: "Repository not found" }, { status: 404 });
        }

        // Get security summary for this repository
        const securityData = await getRepositorySecuritySummary(repo.id);

        return NextResponse.json({
            findings: securityData.recentFindings,
            summary: securityData.bySeverity,
            byCategory: securityData.byCategory,
        });

    } catch (e: any) {
        console.error("Security API Error:", e);
        return NextResponse.json({
            error: "Internal Server Error",
            detail: e?.message || String(e)
        }, { status: 500 });
    }
}
