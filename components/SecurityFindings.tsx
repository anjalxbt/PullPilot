"use client";

import { AlertTriangle, CheckCircle, Shield, ShieldAlert, ShieldX, Filter, FileCode, ChevronDown } from "lucide-react";
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

/* ─── Static severity styles (never use dynamic Tailwind classes) ─── */
const SEVERITY_STYLES: Record<SecuritySeverity, {
    icon: typeof ShieldX;
    activeBg: string;
    activeBorder: string;
    activeLabel: string;
    activeValue: string;
    badgeClasses: string;
    accentColor: string;
}> = {
    critical: {
        icon: ShieldX,
        activeBg: 'bg-red-100 dark:bg-red-900/40',
        activeBorder: 'border-red-300 dark:border-red-700',
        activeLabel: 'text-red-700 dark:text-red-300',
        activeValue: 'text-red-800 dark:text-red-200',
        badgeClasses: 'bg-red-100 dark:bg-red-900/60 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
        accentColor: '#ef4444',
    },
    high: {
        icon: ShieldAlert,
        activeBg: 'bg-orange-100 dark:bg-orange-900/40',
        activeBorder: 'border-orange-300 dark:border-orange-700',
        activeLabel: 'text-orange-700 dark:text-orange-300',
        activeValue: 'text-orange-800 dark:text-orange-200',
        badgeClasses: 'bg-orange-100 dark:bg-orange-900/60 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200',
        accentColor: '#f97316',
    },
    medium: {
        icon: AlertTriangle,
        activeBg: 'bg-yellow-100 dark:bg-yellow-900/40',
        activeBorder: 'border-yellow-300 dark:border-yellow-700',
        activeLabel: 'text-yellow-700 dark:text-yellow-300',
        activeValue: 'text-yellow-800 dark:text-yellow-200',
        badgeClasses: 'bg-yellow-100 dark:bg-yellow-900/60 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
        accentColor: '#eab308',
    },
    low: {
        icon: Shield,
        activeBg: 'bg-blue-100 dark:bg-blue-900/40',
        activeBorder: 'border-blue-300 dark:border-blue-700',
        activeLabel: 'text-blue-700 dark:text-blue-300',
        activeValue: 'text-blue-800 dark:text-blue-200',
        badgeClasses: 'bg-blue-100 dark:bg-blue-900/60 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200',
        accentColor: '#3b82f6',
    },
};

/* ─── Severity Badge ─── */
export function SeverityBadge({ severity, count }: { severity: SecuritySeverity; count?: number }) {
    const style = SEVERITY_STYLES[severity];
    const Icon = style.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${style.badgeClasses}`}>
            <Icon className="h-3 w-3" />
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
            {count !== undefined && <span>({count})</span>}
        </span>
    );
}

/* ─── Summary Cards ─── */
function SummaryCards({ summary }: { summary: SecuritySummary }) {
    if (summary.total === 0) {
        return (
            <div className="flex items-center justify-center py-10 px-6 rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-100 dark:bg-green-900/40">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400 mr-4 flex-shrink-0" />
                <div>
                    <p className="font-bold text-lg text-green-800 dark:text-green-200">No Security Issues Found</p>
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">All scans passed without detecting vulnerabilities</p>
                </div>
            </div>
        );
    }

    const severities: SecuritySeverity[] = ['critical', 'high', 'medium', 'low'];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {severities.map((severity) => {
                const count = summary[severity];
                const style = SEVERITY_STYLES[severity];
                const Icon = style.icon;
                const isActive = count > 0;

                return (
                    <div
                        key={severity}
                        className={`p-5 rounded-xl border-2 transition-all duration-300 ${isActive
                            ? `${style.activeBg} ${style.activeBorder} shadow-sm`
                            : 'bg-zinc-100 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-600'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <Icon className={`h-5 w-5 ${isActive ? style.activeLabel : 'text-zinc-500 dark:text-zinc-400'}`} />
                            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isActive ? style.activeLabel : 'text-zinc-500 dark:text-zinc-400'
                                }`}>
                                {severity}
                            </span>
                        </div>
                        <div className={`text-3xl font-black ${isActive ? style.activeValue : 'text-zinc-500 dark:text-zinc-400'
                            }`}>
                            {count}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Category Breakdown ─── */
function CategoryBreakdown({ findings }: { findings: SecurityFinding[] }) {
    const byCategory = findings.reduce((acc, f) => {
        acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    if (categories.length === 0) return null;

    return (
        <div>
            <p className="text-sm font-semibold text-gray-200 mb-3">Issues by Category</p>
            <div className="flex flex-wrap gap-2">
                {categories.map(([category, count]) => (
                    <span
                        key={category}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-gray-200  border border-zinc-300 dark:border-zinc-600"
                    >
                        {category.replace(/-/g, ' ')}
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-gray-200  text-xs font-bold">{count}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ─── Finding Card ─── */
function FindingCard({ finding }: { finding: SecurityFinding }) {
    const style = SEVERITY_STYLES[finding.severity];

    return (
        <div
            className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all duration-200 space-y-3"
            style={{ borderLeftWidth: '4px', borderLeftColor: style.accentColor }}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <SeverityBadge severity={finding.severity} />
                        <code className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded font-mono">
                            {finding.rule_id}
                        </code>
                    </div>
                    <h4 className="font-bold text-gray-200  text-base">{finding.rule_name}</h4>
                </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{finding.message}</p>

            {finding.file_path && (
                <div className="flex items-center gap-2 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <FileCode className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-mono truncate">{finding.file_path}</span>
                    {finding.line_number && <span className="text-primary font-bold flex-shrink-0">:L{finding.line_number}</span>}
                </div>
            )}

            {finding.code_snippet && (
                <pre className="p-4 rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 text-xs font-mono overflow-x-auto text-zinc-100 leading-relaxed">
                    {finding.code_snippet}
                </pre>
            )}
        </div>
    );
}

/* ─── Main Component ─── */
export default function SecurityFindings({ findings, summary, loading }: SecurityFindingsProps) {
    const [severityFilter, setSeverityFilter] = useState<SecuritySeverity | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const categories = [...new Set(findings.map(f => f.category))];

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
                        <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
                    ))}
                </div>
                <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
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
            {findings.length > 0 && <CategoryBreakdown findings={findings} />}

            {/* Filters */}
            {findings.length > 0 && (
                <div className="flex flex-wrap gap-3 items-center py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600">
                    <Filter className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-sm font-semibold text-gray-200">Filter:</span>

                    <div className="relative">
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value as SecuritySeverity | 'all')}
                            className="text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-200 pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="all">All Severities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-foreground pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat.replace(/-/g, ' ')}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
                    </div>

                    <span className="text-xs text-zinc-600 dark:text-zinc-300 ml-auto font-semibold">
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
                    <Filter className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
                    <p className="text-foreground font-semibold">No findings match the current filters</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Try adjusting the severity or category filter</p>
                </div>
            )}
        </div>
    );
}
