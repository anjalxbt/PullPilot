# Feature: Auto Labeler

This folder contains sample files designed to trigger PullPilot's automatic label detection.

## What to Expect
When you raise a PR with these files, PullPilot should:
- Detect labels based on **PR title/description keywords**
- Detect labels based on **file patterns** (docs, tests, CI, dependencies)
- Show confidence scores for each label
- Auto-apply labels with confidence ≥ 70%
- Detect `needs-tests` if source code has no corresponding tests

## Test Steps
1. `git checkout -b test/auto-labeler`
2. Add these files and use a descriptive PR title (e.g., "fix: resolve login bug")
3. Push and open a PR
4. Check for `🏷️ Auto-Labels` section in the PR comment
