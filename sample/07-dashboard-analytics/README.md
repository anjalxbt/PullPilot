# Feature: Dashboard & Analytics

This folder documents the dashboard and analytics visualization features 
of PullPilot's web interface.

## What to Expect
The dashboard provides:
- **Pull Requests Tab** — Table of PRs with AI review summaries
- **Analytics Tab** — Charts and metrics using Recharts:
  - Reviews over time (line chart)
  - Issue distribution by category (bar chart)
  - Security findings breakdown (doughnut chart)
  - Performance metrics (avg review time, etc.)
- **Security Tab** — Security findings dashboard with:
  - Severity cards (Critical, High, Medium, Low)
  - Filtering by severity, category, and repository
  - Detailed findings table
- **Settings Tab** — Custom rule configuration form

## Test Steps
1. Deploy the application locally: `npm run dev`
2. Navigate to `http://localhost:3000/dashboard`
3. Verify each tab renders correctly:
   - Pull Requests: review summaries show AI model badge
   - Analytics: charts render with data
   - Security: severity cards and findings display properly
   - Settings: configuration form is functional
4. Test responsive layout (mobile/tablet/desktop)

## Components to Test
| Component | File | Description |
|-----------|------|-------------|
| Analytics Dashboard | `components/AnalyticsDashboard.tsx` | Main analytics view with charts |
| Security Findings | `components/SecurityFindings.tsx` | Security scan results display |
| Install GitHub App | `components/InstallGitHubApp.tsx` | GitHub App installation flow |
| Navbar | `components/Navbar.tsx` | Navigation with theme toggle |
