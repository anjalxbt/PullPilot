# Feature: Fix Generator

This folder contains sample code with auto-fixable issues to test PullPilot's fix suggestion feature.

## What to Expect
When you raise a PR with these files, PullPilot should:
- Detect **console.log** statements and suggest removal
- Detect **unused imports** and suggest removal
- Detect **trailing whitespace** and suggest trim
- Show fix suggestions in a table with "✨ Apply Fix" buttons
- Each fix has a confidence score

## Test Steps
1. `git checkout -b test/fix-generator`
2. Add these files to the repo
3. Push and open a PR
4. Check for `🔧 Auto-Fix Suggestions` section with clickable fix actions
