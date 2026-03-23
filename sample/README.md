# 🧪 PullPilot Feature Testing Samples

Each subfolder contains sample files designed to trigger a specific PullPilot feature when raised as a PR.

## How to Test

1. Create a new branch for each feature: `git checkout -b test/<feature-name>`
2. Copy/add the files from the corresponding folder
3. Push and open a PR
4. Observe PullPilot's response on the PR

## Features

| Folder | Feature | What's Tested |
|--------|---------|---------------|
| `01-ai-code-review/` | AI Code Review | AI-powered PR analysis with summary, highlights, concerns, suggestions |
| `02-security-scanner/` | Security Scanner | Detection of hardcoded secrets, SQL injection, XSS, eval usage, etc. |
| `03-auto-labeler/` | Auto Labeler | Automatic label detection (bug, feature, docs, dependencies, etc.) |
| `04-fix-generator/` | Fix Generator | Auto-fix suggestions for console.logs, unused imports, trailing whitespace |
| `05-custom-rules/` | Custom Rules Engine | `.pullpilot.yml` rule enforcement (PR size, file patterns, content patterns) |
| `06-webhook-handler/` | Webhook Integration | GitHub webhook event processing |
| `07-dashboard-analytics/` | Dashboard & Analytics | Dashboard UI components and analytics visualization |
