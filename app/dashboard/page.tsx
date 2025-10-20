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
      <main className="min-h-screen bg-background flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="text-2xl font-semibold text-foreground mb-2">Loading...</div>
          <p className="text-secondary">Please wait while we load your dashboard</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background transition-colors duration-300">
      <div className="container-md py-8">
        <Card className="mb-8 bg-card border-border transition-colors duration-300">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar src={(session.user?.image as string) || ghUser?.avatar_url || ""} alt={session.user?.name || ghUser?.name || ghUser?.login || "User"} className="h-16 w-16" />
              <div>
                <CardTitle className="text-card-foreground">{session.user?.name || ghUser?.name || ghUser?.login}</CardTitle>
                <CardDescription className="text-muted-foreground">@{ghUser?.login || session.user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="prs">
          <TabsList>
            <TabsTrigger tabValue="prs">Pull Requests</TabsTrigger>
            <TabsTrigger tabValue="repos">Repositories</TabsTrigger>
            <TabsTrigger tabValue="analytics">Analytics</TabsTrigger>
            <TabsTrigger tabValue="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent tabValue="prs">
            <Card className="bg-card border-border transition-colors duration-300">
              <CardHeader>
                <CardTitle className="text-card-foreground">Recent Pull Requests</CardTitle>
                <CardDescription className="text-muted-foreground">AI-reviewed pull requests from your repositories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">No recent PRs yet.</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent tabValue="repos">
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-sm text-red-600 dark:text-red-400 transition-colors duration-300">
                  {error}
                </div>
              )}

              {loadingRepos ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-40 bg-card border border-border rounded-lg animate-pulse transition-colors duration-300"
                    />
                  ))}
                </div>
              ) : repos.length === 0 ? (
                <Card className="bg-card border-border transition-colors duration-300">
                  <CardContent className="py-12 text-center">
                    <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No repositories found.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <div className="h-full p-5 bg-card border border-border rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-card-foreground truncate group-hover:text-primary transition-colors">
                                {repo.full_name}
                              </h3>
                            </div>
                            <div className="ml-2 flex-shrink-0">
                              {repo.private ? (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Globe className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {/* Visibility Badge */}
                          <div className="mb-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
                                repo.private
                                  ? "bg-muted text-muted-foreground border border-border"
                                  : "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50"
                              }`}
                            >
                              {repo.visibility ?? (repo.private ? "private" : "public")}
                            </span>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              <span>{repo.stargazers_count}</span>
                            </div>
                            <div className="text-xs">
                              {formatRelativeTime(repo.updated_at)}
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                </div>
              )}

              {repos.length > 0 &&
                repos.filter((repo) =>
                  repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <Card className="bg-card border-border transition-colors duration-300">
                    <CardContent className="py-12 text-center">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No repositories match your search.</p>
                    </CardContent>
                  </Card>
                )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent tabValue="analytics">
            <Card className="bg-card border-border transition-colors duration-300">
              <CardHeader>
                <CardTitle className="text-card-foreground">Review Analytics</CardTitle>
                <CardDescription className="text-muted-foreground">Track your code review activity and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 text-card-foreground">Weekly Activity</h4>
                  <AnalyticsChart />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg transition-colors duration-300">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24</div>
                    <div className="text-sm text-secondary">PRs Reviewed</div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-lg transition-colors duration-300">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">18</div>
                    <div className="text-sm text-secondary">Issues Found</div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-lg transition-colors duration-300">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">92%</div>
                    <div className="text-sm text-secondary">Code Quality</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent tabValue="settings">
            <Card className="bg-card border-border transition-colors duration-300">
              <CardHeader>
                <CardTitle className="text-card-foreground">Custom Review Rules</CardTitle>
                <CardDescription className="text-muted-foreground">Define custom rules for AI to enforce during code reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="rule-name" className="text-card-foreground">Rule Name</Label>
                    <Input id="rule-name" placeholder="e.g., Enforce TypeScript strict mode" className="bg-background border-border text-foreground placeholder:text-muted-foreground transition-colors duration-200" />
                  </div>
                  <div>
                    <Label htmlFor="rule-description" className="text-card-foreground">Description</Label>
                    <Textarea
                      id="rule-description"
                      placeholder="Describe what this rule checks for..."
                      rows={4}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="severity" className="text-card-foreground">Severity</Label>
                    <Input id="severity" placeholder="error | warning | info" className="bg-background border-border text-foreground placeholder:text-muted-foreground transition-colors duration-200" />
                  </div>
                  <Button type="button" className="bg-primary hover:bg-primary/90 text-white transition-all duration-200">Save Rule</Button>
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
