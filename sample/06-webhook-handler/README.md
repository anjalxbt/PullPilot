# Feature: Webhook Integration

This folder contains sample webhook payloads to understand and test 
PullPilot's GitHub webhook processing.

## What to Expect
PullPilot processes GitHub webhook events:
- **pull_request.opened** — Triggers full review on new PRs
- **pull_request.synchronize** — Re-reviews on new commits pushed to PR
- Verifies webhook signatures for security
- Fetches PR diff and files from GitHub API
- Orchestrates AI review, security scan, auto-labeling, and fix generation

## How Webhooks Work
1. GitHub sends a POST to `/api/webhooks/github` when a PR event occurs
2. PullPilot verifies the webhook signature (`X-Hub-Signature-256`)
3. On valid `pull_request` events (opened/synchronize), it:
   - Fetches the PR diff and changed files
   - Runs AI review analysis
   - Runs security scanning
   - Detects labels
   - Generates fix suggestions
   - Evaluates custom rules
   - Posts results as PR comments

## Test Steps
1. Install the GitHub App on your test repository
2. Open or update a PR in the repo
3. Observe the webhook trigger and PR comment generation
4. Check webhook delivery logs in GitHub App settings

## Sample Payload
See `sample-webhook-payload.json` for the structure of a GitHub PR event.
