"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SecurityFindings, { SecurityFinding, SecuritySummary } from "@/components/SecurityFindings";
import { ArrowLeft, Calendar, ExternalLink, FileText, Github, GitPullRequest, Shield, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type GitHubRepo = {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    visibility?: string;
    stargazers_count: number;
    html_url: string;
    updated_at: string;
};

type Review = {
    id: string;
    pr_number: number;
    pr_title: string;
    review_summary: string;
    review_posted_at: string;
    security_total?: number;
    repositories: {
        repo_full_name: string;
        repo_name: string;
    };
};

type SecurityData = {
    findings: SecurityFinding[];
    summary: SecuritySummary;
};

export default function RepositoryPage({ params }: { params: { repoId: string } }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { repoId } = params;

    const [repo, setRepo] = useState<GitHubRepo | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [securityData, setSecurityData] = useState<SecurityData>({
        findings: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [securityLoading, setSecurityLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/");
        }
    }, [status, router]);

    useEffect(() => {
        if (!session || !repoId) return;

        async function load() {
            setLoading(true);
            try {
                // Fetch all repos to find the current one
                const reposRes = await fetch("/api/github/repos");
                if (!reposRes.ok) throw new Error("Failed to load repository details");

                const repos = await reposRes.json() as GitHubRepo[];
                const currentRepo = repos.find(r => r.id.toString() === repoId);

                if (!currentRepo) {
                    setError("Repository not found");
                    return;
                }
                setRepo(currentRepo);

                // Fetch reviews for this repo
                const reviewsRes = await fetch(`/api/github/reviews?repoId=${repoId}`);
                if (!reviewsRes.ok) throw new Error("Failed to load reviews");

                const reviewsData = await reviewsRes.json() as Review[];
                setReviews(reviewsData);

            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        async function loadSecurity() {
            setSecurityLoading(true);
            try {
                const securityRes = await fetch(`/api/github/security?repoId=${repoId}`);
                if (securityRes.ok) {
                    const data = await securityRes.json();
                    setSecurityData({
                        findings: data.findings || [],
                        summary: data.summary || { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
                    });
                }
            } catch (e) {
                console.error("Failed to load security data:", e);
            } finally {
                setSecurityLoading(false);
            }
        }

        load();
        loadSecurity();
    }, [session, repoId]);

    if (status === "loading" || (loading && !repo)) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="text-2xl font-semibold text-foreground mb-2">Loading...</div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-background p-8">
                <Button variant="outline" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div className="text-red-500 font-medium">{error}</div>
            </main>
        );
    }

    // Calculate total security issues across reviews
    const totalSecurityIssues = securityData.summary.total;

    return (
        <main className="min-h-screen bg-background transition-colors duration-300">
            <div className="container-md py-8 max-w-5xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <Button variant="outline" onClick={() => router.back()} className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                    </Button>

                    {repo && (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                                    {repo.full_name}
                                    <span className={`text-sm font-normal px-2.5 py-0.5 rounded-full border ${repo.private ? 'bg-muted text-muted-foreground border-border' : 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50'}`}>
                                        {repo.visibility ?? (repo.private ? "private" : "public")}
                                    </span>
                                </h1>
                                <p className="text-muted-foreground flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1">
                                        <Star className="h-4 w-4" /> {repo.stargazers_count} stars
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" /> Updated {new Date(repo.updated_at).toLocaleDateString()}
                                    </span>
                                </p>
                            </div>
                            <a
                                href={repo.html_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
                            >
                                <Github className="h-4 w-4 mr-2" />
                                View on GitHub
                                <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Tabs Content */}
                <Tabs defaultValue="reviews" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger tabValue="reviews" className="flex items-center gap-2">
                            <GitPullRequest className="h-4 w-4" />
                            Pull Requests
                            {reviews.length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                                    {reviews.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger tabValue="security" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Security
                            {totalSecurityIssues > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${securityData.summary.critical > 0
                                        ? 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                                        : securityData.summary.high > 0
                                            ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                                            : 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400'
                                    }`}>
                                    {totalSecurityIssues}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Pull Requests Tab */}
                    <TabsContent tabValue="reviews">
                        <Card className="bg-card border-border transition-colors duration-300">
                            <CardHeader>
                                <CardTitle className="text-card-foreground">Pull Requests & Reviews</CardTitle>
                                <CardDescription className="text-muted-foreground">AI-reviewed pull requests for {repo?.name}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {reviews.length === 0 ? (
                                    <div className="text-center py-12">
                                        <GitPullRequest className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No reviewed pull requests found for this repository.</p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Make sure the PullPilot app is installed and you&apos;ve opened a PR.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {reviews.map((review, index) => (
                                            <div
                                                key={review.id}
                                                className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-all duration-200"
                                                style={{
                                                    animation: `fadeIn 0.5s ease-out ${index * 0.05}s both`,
                                                }}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-muted-foreground text-sm flex items-center gap-1">
                                                                <span className="font-mono">#{review.pr_number}</span>
                                                            </span>
                                                            {review.security_total && review.security_total > 0 && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                                                                    <Shield className="h-3 w-3" />
                                                                    {review.security_total}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className="font-medium text-card-foreground truncate">{review.pr_title || `Pull Request #${review.pr_number}`}</h4>
                                                    </div>
                                                    <div className="ml-4 text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(review.review_posted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>

                                                <div className="mt-2 text-sm text-secondary">
                                                    <FileText className="inline-block h-3 w-3 mr-1 text-muted-foreground" />
                                                    {review.review_summary}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent tabValue="security">
                        <Card className="bg-card border-border transition-colors duration-300">
                            <CardHeader>
                                <CardTitle className="text-card-foreground flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Security Findings
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Security vulnerabilities detected in pull request reviews
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SecurityFindings
                                    findings={securityData.findings}
                                    summary={securityData.summary}
                                    loading={securityLoading}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    );
}

