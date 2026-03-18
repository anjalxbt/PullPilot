"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  GitPullRequest,
  FileText,
  TrendingUp,
  Plus,
  Minus,
  Code2,
  Users,
  Activity,
} from "lucide-react";

/* ─── Types ─── */
export type AnalyticsReview = {
  id: string;
  pr_number: number;
  pr_title: string;
  pr_author?: string;
  review_summary: string;
  review_posted_at: string;
  files_changed?: number;
  additions?: number;
  deletions?: number;
  repositories: {
    repo_full_name: string;
    repo_name: string;
  };
};

export type AnalyticsRepo = {
  id: number;
  name: string;
  full_name: string;
};

type Props = {
  reviews: AnalyticsReview[];
  repos: AnalyticsRepo[];
};

/* ─── Palette ─── */
const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#14b8a6", // teal
];

/* ─── Custom Tooltip ─── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-zinc-500 dark:text-zinc-400">{entry.name}:</span>
          <span className="font-bold text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  colorClass,
  bgClass,
}: {
  icon: any;
  label: string;
  value: string | number;
  subValue?: string;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className={`relative overflow-hidden p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 ${bgClass} transition-all duration-300 hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${bgClass}`}>
          <Icon className={`h-5 w-5 ${colorClass}`} />
        </div>
      </div>
      <div className={`text-3xl font-black ${colorClass}`}>{value}</div>
      <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">{label}</div>
      {subValue && <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{subValue}</div>}
    </div>
  );
}

/* ─── Main Component ─── */
export default function AnalyticsDashboard({ reviews, repos }: Props) {
  /* ————— Computed data ————— */
  const stats = useMemo(() => {
    const totalReviews = reviews.length;
    const totalRepos = repos.length;
    const totalAdditions = reviews.reduce((s, r) => s + (r.additions || 0), 0);
    const totalDeletions = reviews.reduce((s, r) => s + (r.deletions || 0), 0);
    const totalFilesChanged = reviews.reduce((s, r) => s + (r.files_changed || 0), 0);
    const avgFilesPerPR = totalReviews > 0 ? Math.round(totalFilesChanged / totalReviews) : 0;
    const uniqueAuthors = new Set(reviews.map(r => r.pr_author).filter(Boolean)).size;

    return { totalReviews, totalRepos, totalAdditions, totalDeletions, totalFilesChanged, avgFilesPerPR, uniqueAuthors };
  }, [reviews, repos]);

  /* Activity timeline — group reviews by date */
  const activityData = useMemo(() => {
    if (reviews.length === 0) return [];
    const byDate = new Map<string, { reviews: number; additions: number; deletions: number }>();

    // Get last 30 days
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDate.set(key, { reviews: 0, additions: 0, deletions: 0 });
    }

    reviews.forEach(r => {
      const key = new Date(r.review_posted_at).toISOString().slice(0, 10);
      const existing = byDate.get(key);
      if (existing) {
        existing.reviews++;
        existing.additions += r.additions || 0;
        existing.deletions += r.deletions || 0;
      }
    });

    return Array.from(byDate.entries()).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ...data,
    }));
  }, [reviews]);

  /* Reviews per repository — bar chart */
  const repoDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    reviews.forEach(r => {
      const name = r.repositories?.repo_name || "Unknown";
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [reviews]);

  /* Code churn per repository — for pie chart */
  const codeChurnByRepo = useMemo(() => {
    const churn = new Map<string, number>();
    reviews.forEach(r => {
      const name = r.repositories?.repo_name || "Unknown";
      churn.set(name, (churn.get(name) || 0) + (r.additions || 0) + (r.deletions || 0));
    });
    return Array.from(churn.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [reviews]);

  /* Top contributors */
  const topContributors = useMemo(() => {
    const counts = new Map<string, number>();
    reviews.forEach(r => {
      const author = r.pr_author || "unknown";
      counts.set(author, (counts.get(author) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([author, prs]) => ({ author, prs }))
      .sort((a, b) => b.prs - a.prs)
      .slice(0, 5);
  }, [reviews]);

  /* Recent reviews list */
  const recentReviews = useMemo(() => {
    return [...reviews]
      .sort((a, b) => new Date(b.review_posted_at).getTime() - new Date(a.review_posted_at).getTime())
      .slice(0, 5);
  }, [reviews]);

  /* ————— Empty state ————— */
  if (reviews.length === 0 && repos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Activity className="h-8 w-8 text-primary" />
        </div>
        <p className="text-foreground font-semibold text-lg">No analytics data yet</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Install the GitHub App and open pull requests to start seeing review analytics here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={GitPullRequest}
          label="PRs Reviewed"
          value={stats.totalReviews}
          colorClass="text-blue-600 dark:text-blue-400"
          bgClass="bg-blue-50 dark:bg-blue-950/30"
        />
        <StatCard
          icon={Code2}
          label="Repositories"
          value={stats.totalRepos}
          colorClass="text-purple-600 dark:text-purple-400"
          bgClass="bg-purple-50 dark:bg-purple-950/30"
        />
        <StatCard
          icon={FileText}
          label="Files Changed"
          value={stats.totalFilesChanged.toLocaleString()}
          subValue={`~${stats.avgFilesPerPR} per PR`}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgClass="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <StatCard
          icon={Users}
          label="Contributors"
          value={stats.uniqueAuthors}
          colorClass="text-amber-600 dark:text-amber-400"
          bgClass="bg-amber-50 dark:bg-amber-950/30"
        />
      </div>

      {/* ─── Code Changes Summary ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
            <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-green-700 dark:text-green-300">
              +{stats.totalAdditions.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">Lines added</div>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40">
            <Minus className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-red-700 dark:text-red-300">
              -{stats.totalDeletions.toLocaleString()}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400 font-medium">Lines removed</div>
          </div>
        </div>
      </div>

      {/* ─── Activity Timeline ─── */}
      {activityData.length > 0 && (
        <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">Review Activity (Last 30 Days)</h4>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="reviewGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(113,113,122,0.2)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(113,113,122,0.2)' }}
                  interval={Math.max(0, Math.floor(activityData.length / 7) - 1)}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="reviews"
                  name="Reviews"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#reviewGradient)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#6366f1', fill: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reviews by Repo */}
        {repoDistribution.length > 0 && (
          <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
            <h4 className="text-sm font-bold text-foreground mb-4">Reviews by Repository</h4>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repoDistribution} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(113,113,122,0.2)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="PRs" radius={[0, 6, 6, 0]} maxBarSize={24}>
                    {repoDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Code Churn Pie */}
        {codeChurnByRepo.length > 0 && (
          <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
            <h4 className="text-sm font-bold text-foreground mb-4">Code Churn by Repository</h4>
            <div className="w-full h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={codeChurnByRepo}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={2}
                    stroke="rgba(255,255,255,0.3)"
                  >
                    {codeChurnByRepo.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-xs text-zinc-500 dark:text-zinc-400">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Row: Contributors + Recent ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contributors */}
        {topContributors.length > 0 && (
          <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">Top Contributors</h4>
            </div>
            <div className="space-y-3">
              {topContributors.map((c, i) => {
                const maxPrs = topContributors[0].prs;
                const percentage = maxPrs > 0 ? (c.prs / maxPrs) * 100 : 0;
                return (
                  <div key={c.author} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-400 w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground truncate">{c.author}</span>
                        <span className="text-xs font-bold text-primary ml-2">{c.prs} PRs</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentReviews.length > 0 && (
          <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">Recent Reviews</h4>
            </div>
            <div className="space-y-3">
              {recentReviews.map((r) => (
                <a
                  key={r.id}
                  href={`https://github.com/${r.repositories.repo_full_name}/pull/${r.pr_number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors group"
                >
                  <div className="pt-0.5">
                    <GitPullRequest className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {r.pr_title || `PR #${r.pr_number}`}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {r.repositories.repo_name} · #{r.pr_number} · {new Date(r.review_posted_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {(r.additions || r.deletions) ? (
                    <div className="text-xs text-zinc-400 font-mono whitespace-nowrap">
                      <span className="text-green-500">+{r.additions || 0}</span>{" "}
                      <span className="text-red-500">-{r.deletions || 0}</span>
                    </div>
                  ) : null}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
