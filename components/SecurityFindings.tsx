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

// Severity badge component
export function SeverityBadge({ severity, count }: { severity: SecuritySeverity; count?: number }) {
    const config: Record<SecuritySeverity, { bg: string; text: string; icon: typeof ShieldAlert }> = {
        critical: {
            bg: "bg-red-100 dark:bg-red-950/50 border-red-200 dark:border-red-900/50",
            text: "text-red-700 dark:text-red-400",
            icon: ShieldX
        },
        high: {
            bg: "bg-orange-100 dark:bg-orange-950/50 border-orange-200 dark:border-orange-900/50",
            text: "text-orange-700 dark:text-orange-400",
            icon: ShieldAlert
        },
        medium: {
            bg: "bg-yellow-100 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-900/50",
            text: "text-yellow-700 dark:text-yellow-400",
            icon: AlertTriangle
        },
        low: {
            bg: "bg-blue-100 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50",
            text: "text-blue-700 dark:text-blue-400",
            icon: Shield
        },
    };

    const { bg, text, icon: Icon } = config[severity];

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${bg} ${text}`}>
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
            <div className="flex items-center justify-center py-8 px-4 rounded-lg border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">No Security Issues Found</p>
                    <p className="text-sm text-green-600 dark:text-green-500">All scans passed without detecting vulnerabilities</p>
                </div>
            </div>
        );
    }

    const cards = [
        { severity: 'critical' as const, count: summary.critical, color: 'red' },
        { severity: 'high' as const, count: summary.high, color: 'orange' },
        { severity: 'medium' as const, count: summary.medium, color: 'yellow' },
        { severity: 'low' as const, count: summary.low, color: 'blue' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cards.map(({ severity, count, color }) => (
                <div
                    key={severity}
                    className={`p-4 rounded-lg border transition-all duration-200 ${count > 0
                            ? `bg-${color}-50 dark:bg-${color}-950/30 border-${color}-200 dark:border-${color}-900/50`
                            : 'bg-muted/50 border-border opacity-60'
                        }`}
                >
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium uppercase tracking-wide ${count > 0 ? `text-${color}-600 dark:text-${color}-400` : 'text-muted-foreground'
                            }`}>
                            {severity}
                        </span>
                    </div>
                    <div className={`text-2xl font-bold ${count > 0 ? `text-${color}-700 dark:text-${color}-400` : 'text-muted-foreground'
                        }`}>
                        {count}
                    </div>
                </div>
            ))}
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
        <div className="flex flex-wrap gap-2">
            {categories.map(([category, count]) => (
                <span
                    key={category}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border"
                >
                    {category.replace(/-/g, ' ')}
                    <span className="text-foreground font-bold">{count}</span>
                </span>
            ))}
        </div>
    );
}

// Individual finding card
function FindingCard({ finding }: { finding: SecurityFinding }) {
    return (
        <div className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-all duration-200 space-y-3">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <SeverityBadge severity={finding.severity} />
                        <span className="text-xs font-mono text-muted-foreground">{finding.rule_id}</span>
                    </div>
                    <h4 className="font-medium text-card-foreground">{finding.rule_name}</h4>
                </div>
            </div>

            <p className="text-sm text-muted-foreground">{finding.message}</p>

            {finding.file_path && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileCode className="h-3 w-3" />
                    <span className="font-mono">{finding.file_path}</span>
                    {finding.line_number && <span className="text-primary">:L{finding.line_number}</span>}
                </div>
            )}

            {finding.code_snippet && (
                <pre className="mt-2 p-3 rounded-md bg-muted/50 border border-border text-xs font-mono overflow-x-auto text-foreground">
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
            <div className="animate-pulse space-y-4">
                <div className="h-24 bg-muted rounded-lg" />
                <div className="h-48 bg-muted rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary */}
            <SummaryCards summary={summary} />

            {/* Category breakdown */}
            {findings.length > 0 && (
                <div>
                    <p className="text-sm text-muted-foreground mb-2">Issues by Category</p>
                    <CategoryBreakdown findings={findings} />
                </div>
            )}

            {/* Filters */}
            {findings.length > 0 && (
                <div className="flex flex-wrap gap-3 items-center py-3 px-4 rounded-lg bg-muted/50 border border-border">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter:</span>

                    {/* Severity filter */}
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value as SecuritySeverity | 'all')}
                        className="text-sm rounded-md border border-border bg-background px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
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
                        className="text-sm rounded-md border border-border bg-background px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat.replace(/-/g, ' ')}</option>
                        ))}
                    </select>

                    <span className="text-xs text-muted-foreground ml-auto">
                        Showing {filteredFindings.length} of {findings.length}
                    </span>
                </div>
            )}

            {/* Findings list */}
            {filteredFindings.length > 0 && (
                <div className="space-y-3">
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
                <div className="text-center py-8 text-muted-foreground">
                    <p>No findings match the current filters</p>
                </div>
            )}
        </div>
    );
}
