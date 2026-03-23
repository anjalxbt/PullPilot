/**
 * Sample analytics data for testing the dashboard
 * This mock data can be used to verify chart rendering
 */

export const sampleReviewData = [
  { date: '2026-03-18', reviews: 5, issues: 3, fixes: 2 },
  { date: '2026-03-19', reviews: 8, issues: 5, fixes: 4 },
  { date: '2026-03-20', reviews: 12, issues: 7, fixes: 6 },
  { date: '2026-03-21', reviews: 6, issues: 2, fixes: 2 },
  { date: '2026-03-22', reviews: 15, issues: 9, fixes: 7 },
  { date: '2026-03-23', reviews: 10, issues: 4, fixes: 3 },
  { date: '2026-03-24', reviews: 3, issues: 1, fixes: 1 },
];

export const sampleSecurityData = {
  critical: 2,
  high: 5,
  medium: 12,
  low: 8,
};

export const sampleCategoryBreakdown = [
  { category: 'Secrets', count: 3 },
  { category: 'SQL Injection', count: 2 },
  { category: 'XSS', count: 4 },
  { category: 'Crypto', count: 1 },
  { category: 'Auth', count: 3 },
];

export const sampleLabelStats = [
  { label: 'bug', count: 15, color: '#d73a4a' },
  { label: 'feature', count: 22, color: '#a2eeef' },
  { label: 'enhancement', count: 8, color: '#7057ff' },
  { label: 'documentation', count: 12, color: '#0075ca' },
  { label: 'dependencies', count: 6, color: '#0366d6' },
  { label: 'needs-tests', count: 9, color: '#fbca04' },
];

export const samplePerformanceMetrics = {
  avgReviewTime: '2.3s',
  totalReviews: 156,
  totalFixesApplied: 42,
  securityIssuesFound: 27,
  labelsApplied: 89,
};
