"use client";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AnalyticsChart from "@/components/AnalyticsChart";
import { Star, Lock, Globe, Search, Github } from "lucide-react";

type GitHubUser = {
  login: string;
  name?: string;
  avatar_url?: string;
};

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ghUser, setGhUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    let canceled = false;
    async function load() {
      if (!session) return;
      setError(null);
      try {
        const [uRes, rRes] = await Promise.all([
          fetch("/api/github/user", { cache: "no-store" }),
          (async () => {
            setLoadingRepos(true);
            return fetch("/api/github/repos", { cache: "no-store" });
          })(),
        ]);

        if (!canceled) {
          if (uRes.ok) {
            const u = (await uRes.json()) as GitHubUser;
            setGhUser(u);
          } else {
            const t = await uRes.text();
            setError(`Failed to load GitHub user: ${t}`);
          }

          if (rRes.ok) {
            const r = (await rRes.json()) as GitHubRepo[];
            setRepos(r);
          } else {
            const t = await rRes.text();
            setError((prev) => prev ?? `Failed to load repositories: ${t}`);
          }
        }
      } catch (e: any) {
        if (!canceled) setError(e?.message || "Unexpected error");
      } finally {
        if (!canceled) setLoadingRepos(false);
      }
    }
    load();
    return () => {
      canceled = true;
    };
  }, [session]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-foreground mb-2">Loading...</div>
          <p className="text-muted-foreground">Please wait while we load your dashboard</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container-md py-8 space-y-8">
        {/* User Profile Card */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-6">
              <Avatar 
                src={(session.user?.image as string) || ghUser?.avatar_url || ""} 
                alt={session.user?.name || ghUser?.name || ghUser?.login || "User"} 
                className="h-20 w-20 ring-2 ring-primary/20" 
              />
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold">
                  {session.user?.name || ghUser?.name || ghUser?.login}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  @{ghUser?.login || session.user?.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="repos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-muted/50 p-1">
            <TabsTrigger tabValue="repos" className="data-[state=active]:bg-background">Repositories</TabsTrigger>
            <TabsTrigger tabValue="prs" className="data-[state=active]:bg-background">Pull Requests</TabsTrigger>
            <TabsTrigger tabValue="analytics" className="data-[state=active]:bg-background">Analytics</TabsTrigger>
            <TabsTrigger tabValue="settings" className="data-[state=active]:bg-background">Settings</TabsTrigger>
          </TabsList>

          <TabsContent tabValue="prs" className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl">Recent Pull Requests</CardTitle>
                <CardDescription>AI-reviewed pull requests from your repositories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <Github className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-base text-muted-foreground">No recent PRs yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Pull requests will appear here once reviewed</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent tabValue="repos" className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {error && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {loadingRepos ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-48 bg-muted/50 border border-border rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : repos.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="py-16 text-center">
                  <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
                    <Github className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground mb-1">No repositories found</p>
                  <p className="text-sm text-muted-foreground">Your repositories will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {repos.filter((repo) =>
                      repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length} {repos.filter((repo) =>
                      repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 1 ? 'repository' : 'repositories'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {repos
                    .filter((repo) =>
                      repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((repo, index) => (
                      <a
                        key={repo.id}
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="group block"
                        style={{
                          animation: `fadeIn 0.5s ease-out ${index * 0.05}s both`,
                        }}
                      >
                        <Card className="h-full border-border bg-card transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50 group-hover:bg-accent/5">
                          <CardContent className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors mb-1">
                                  {repo.full_name}
                                </h3>
                              </div>
                              <div className="ml-3 flex-shrink-0">
                                {repo.private ? (
                                  <div className="rounded-full bg-muted p-2">
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                ) : (
                                  <div className="rounded-full bg-primary/10 p-2">
                                    <Globe className="h-4 w-4 text-primary" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Visibility Badge */}
                            <div className="mb-6">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  repo.private
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-primary/10 text-primary border border-primary/20"
                                }`}
                              >
                                {repo.visibility ?? (repo.private ? "Private" : "Public")}
                              </span>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Star className="h-4 w-4" />
                                <span className="font-medium">{repo.stargazers_count}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatRelativeTime(repo.updated_at)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </a>
                    ))}
                </div>
              </div>
            )}

            {repos.length > 0 &&
              repos.filter((repo) =>
                repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
                <Card className="border-border bg-card">
                  <CardContent className="py-16 text-center">
                    <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
                      <Search className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-1">No matches found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
                  </CardContent>
                </Card>
              )}
          </TabsContent>

          <TabsContent tabValue="analytics" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl">Review Analytics</CardTitle>
                <CardDescription>Track your code review activity and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">Weekly Activity</h4>
                  <AnalyticsChart />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-primary mb-1">24</div>
                      <div className="text-sm text-muted-foreground">PRs Reviewed</div>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-500/20 bg-purple-500/5">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-purple-400 mb-1">18</div>
                      <div className="text-sm text-muted-foreground">Issues Found</div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-500/20 bg-green-500/5">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-green-400 mb-1">92%</div>
                      <div className="text-sm text-muted-foreground">Code Quality</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent tabValue="settings" className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl">Custom Review Rules</CardTitle>
                <CardDescription>Define custom rules for AI to enforce during code reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="rule-name" className="text-sm font-medium">Rule Name</Label>
                    <Input 
                      id="rule-name" 
                      placeholder="e.g., Enforce TypeScript strict mode" 
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rule-description" className="text-sm font-medium">Description</Label>
                    <Textarea
                      id="rule-description"
                      placeholder="Describe what this rule checks for..."
                      rows={4}
                      className="bg-background border-border resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severity" className="text-sm font-medium">Severity</Label>
                    <Input 
                      id="severity" 
                      placeholder="error | warning | info" 
                      className="bg-background border-border"
                    />
                  </div>
                  <Button type="button" className="bg-primary hover:bg-primary/90">Save Rule</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 30) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}
