"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Shield, ShieldAlert, ShieldX, Filter, FileCode } from "lucide-react";
import { useState } from "react";

// Types matching the backend
export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SecurityFinding {
    id: string;
    rule_id: string;
    rule_name: string;
    severity: SecuritySeverity;
    category: string;
    message: string;
    file_path: string | null;
    line_number: number | null;
    code_snippet: string | null;
    created_at: string;
}

export interface SecuritySummary {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
}

interface SecurityFindingsProps {
    findings: SecurityFinding[];
    summary: SecuritySummary;
    loading?: boolean;
}

// Severity configuration with static Tailwind classes (no dynamic generation)
const SEVERITY_CONFIG = {
    critical: {
        badge: "bg-red-100 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400",
        card: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50",
        label: "text-red-600 dark:text-red-400",
        value: "text-red-700 dark:text-red-400",
        icon: ShieldX,
    },
    high: {
        badge: "bg-orange-100 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400",
        card: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50",
        label: "text-orange-600 dark:text-orange-400",
        value: "text-orange-700 dark:text-orange-400",
        icon: ShieldAlert,
    },
    medium: {
        badge: "bg-yellow-100 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400",
        card: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/50",
        label: "text-yellow-600 dark:text-yellow-400",
        value: "text-yellow-700 dark:text-yellow-400",
        icon: AlertTriangle,
    },
    low: {
        badge: "bg-blue-100 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400",
        card: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50",
        label: "text-blue-600 dark:text-blue-400",
        value: "text-blue-700 dark:text-blue-400",
        icon: Shield,
    },
};

// Severity badge component
export function SeverityBadge({ severity, count }: { severity: SecuritySeverity; count?: number }) {
    const config = SEVERITY_CONFIG[severity];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}>
            <Icon className="h-3 w-3" />
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
            {count !== undefined && <span className="font-bold">({count})</span>}
        </span>
    );
}

// Summary cards showing counts
function SummaryCards({ summary }: { summary: SecuritySummary }) {
    if (summary.total === 0) {
        return (
            <div className="flex items-center justify-center py-10 px-6 rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="h-10 w-10 text-green-500 mr-4 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-lg text-green-700 dark:text-green-400">No Security Issues Found</p>
                    <p className="text-sm text-green-600 dark:text-green-500 mt-1">All scans passed without detecting vulnerabilities</p>
                </div>
            </div>
        );
    }

    const severities: SecuritySeverity[] = ['critical', 'high', 'medium', 'low'];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {severities.map((severity) => {
                const count = summary[severity];
                const config = SEVERITY_CONFIG[severity];
                const Icon = config.icon;
                const isActive = count > 0;

                return (
                    <div
                        key={severity}
                        className={`relative overflow-hidden p-5 rounded-xl border-2 transition-all duration-300 ${
                            isActive
                                ? `${config.card} shadow-sm hover:shadow-md`
                                : 'bg-muted/30 border-border opacity-50'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Icon className={`h-5 w-5 ${isActive ? config.label : 'text-muted-foreground'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                isActive ? config.label : 'text-muted-foreground'
                            }`}>
                                {severity}
                            </span>
                        </div>
                        <div className={`text-3xl font-black ${
                            isActive ? config.value : 'text-muted-foreground'
                        }`}>
                            {count}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Category breakdown
function CategoryBreakdown({ findings }: { findings: SecurityFinding[] }) {
    const byCategory = findings.reduce((acc, f) => {
        acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

    if (categories.length === 0) return null;

    return (
        <div>
            <p className="text-sm font-medium text-card-foreground mb-3">Issues by Category</p>
            <div className="flex flex-wrap gap-2">
                {categories.map(([category, count]) => (
                    <span
                        key={category}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/80 dark:bg-muted text-card-foreground border border-border hover:border-primary/30 transition-colors"
                    >
                        {category.replace(/-/g, ' ')}
                        <span className="text-primary font-bold">{count}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

// Individual finding card
function FindingCard({ finding }: { finding: SecurityFinding }) {
    const config = SEVERITY_CONFIG[finding.severity];

    return (
        <div className={`p-5 rounded-xl border-l-4 bg-card/50 border border-border hover:bg-card/80 transition-all duration-200 space-y-3`}
             style={{ borderLeftColor: `var(--finding-accent)` }}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <SeverityBadge severity={finding.severity} />
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{finding.rule_id}</span>
                    </div>
                    <h4 className="font-semibold text-card-foreground text-base">{finding.rule_name}</h4>
                </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{finding.message}</p>

            {finding.file_path && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                    <FileCode className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-mono truncate">{finding.file_path}</span>
                    {finding.line_number && <span className="text-primary font-semibold flex-shrink-0">:L{finding.line_number}</span>}
                </div>
            )}

            {finding.code_snippet && (
                <pre className="p-4 rounded-lg bg-muted/60 border border-border text-xs font-mono overflow-x-auto text-card-foreground leading-relaxed">
                    {finding.code_snippet}
                </pre>
            )}
        </div>
    );
}

// Main component
export default function SecurityFindings({ findings, summary, loading }: SecurityFindingsProps) {
    const [severityFilter, setSeverityFilter] = useState<SecuritySeverity | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Get unique categories
    const categories = [...new Set(findings.map(f => f.category))];

    // Filter findings
    const filteredFindings = findings.filter(f => {
        if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
        if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
        return true;
    });

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-muted/50 rounded-xl" />
                    ))}
                </div>
                <div className="h-12 bg-muted/50 rounded-lg" />
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-32 bg-muted/50 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary */}
            <SummaryCards summary={summary} />

            {/* Category breakdown */}
            {findings.length > 0 && (
                <CategoryBreakdown findings={findings} />
            )}

            {/* Filters */}
            {findings.length > 0 && (
                <div className="flex flex-wrap gap-3 items-center py-3 px-4 rounded-xl bg-muted/40 dark:bg-muted/60 border border-border">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-card-foreground">Filter:</span>

                    {/* Severity filter */}
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value as SecuritySeverity | 'all')}
                        className="text-sm rounded-lg border border-border bg-background text-card-foreground px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                        <option value="all">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>

                    {/* Category filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="text-sm rounded-lg border border-border bg-background text-card-foreground px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat.replace(/-/g, ' ')}</option>
                        ))}
                    </select>

                    <span className="text-xs text-muted-foreground ml-auto font-medium">
                        Showing {filteredFindings.length} of {findings.length}
                    </span>
                </div>
            )}

            {/* Findings list */}
            {filteredFindings.length > 0 && (
                <div className="space-y-4">
                    {filteredFindings.map((finding, index) => (
                        <div
                            key={finding.id}
                            style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }}
                        >
                            <FindingCard finding={finding} />
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state after filtering */}
            {findings.length > 0 && filteredFindings.length === 0 && (
                <div className="text-center py-10">
                    <Filter className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-card-foreground font-medium">No findings match the current filters</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting the severity or category filter</p>
                </div>
            )}
        </div>
    );
}
