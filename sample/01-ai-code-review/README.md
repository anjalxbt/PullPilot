# Feature: AI Code Review

This folder contains sample code changes to test PullPilot's AI-powered review feature.

## What to Expect
When you raise a PR with these files, PullPilot should:
- Generate an AI-powered summary of changes
- List **Highlights** (positive aspects)
- List **Concerns** (potential issues)
- List **Suggestions** (improvements)
- Show the AI model used (OpenAI/Anthropic/Gemini/Groq)

## Test Steps
1. `git checkout -b test/ai-code-review`
2. Add these files to the repo
3. Push and open a PR
4. Check the PR comment for the `🤖 AI Code Review` section
