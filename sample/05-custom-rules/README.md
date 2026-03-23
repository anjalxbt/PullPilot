# Feature: Custom Rules Engine

This folder contains a `.pullpilot.yml` config file and sample files designed to 
trigger various custom rule violations.

## What to Expect
When you raise a PR with these files, PullPilot should:
- Enforce **PR size limits** (flag if too many lines changed)
- Block **environment file** modifications
- Detect **console.log** patterns in source code
- Check **file pattern** requirements (e.g., API changes need tests)
- Verify **reviewer count** requirements
- Show violations grouped by severity (Error ❌, Warning ⚠️, Info ℹ️)

## Test Steps
1. `git checkout -b test/custom-rules`
2. Add the `.pullpilot.yml` to the repo root (if not already present)
3. Add the sample files
4. Push and open a PR
5. Check for `📋 Custom Rules Check` section
