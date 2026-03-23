# Feature: Security Scanner

This folder contains sample code with intentional security vulnerabilities 
to test PullPilot's security scanning feature.

## What to Expect
When you raise a PR with these files, PullPilot should:
- Detect **hardcoded secrets/API keys**
- Flag **SQL injection** vulnerabilities
- Catch **XSS** risks
- Identify **eval()** usage
- Show severity levels (Critical 🔴, High 🟠, Medium 🟡, Low 🟢)
- Post **inline comments** on the specific vulnerable lines

## Test Steps
1. `git checkout -b test/security-scanner`
2. Add these files to the repo
3. Push and open a PR
4. Check for `🔒 Security Scan Results` section and inline comments
