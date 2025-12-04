/**
 * AI-powered Pull Request Reviewer
 * 
 * This module analyzes pull request diffs and generates review summaries.
 * You can integrate with OpenAI, Anthropic, or other AI providers.
 */

interface PRFile {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
}

interface ReviewResult {
    summary: string;
    highlights: string[];
    concerns: string[];
    suggestions: string[];
    aiModel: string;
}

/**
 * Analyze pull request and generate review
 */
export async function analyzePullRequest(
    prTitle: string,
    prDescription: string,
    files: PRFile[],
    diff: string
): Promise<ReviewResult> {
    // Check if AI provider is configured
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (openaiKey) {
        return await analyzeWithOpenAI(prTitle, prDescription, files, diff);
    } else if (anthropicKey) {
        return await analyzeWithAnthropic(prTitle, prDescription, files, diff);
    } else {
        // Fallback to basic analysis without AI
        return generateBasicReview(prTitle, prDescription, files);
    }
}

/**
 * Analyze with OpenAI
 */
async function analyzeWithOpenAI(
    prTitle: string,
    prDescription: string,
    files: PRFile[],
    diff: string
): Promise<ReviewResult> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }

    const prompt = buildAnalysisPrompt(prTitle, prDescription, files, diff);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert code reviewer. Analyze pull requests and provide constructive feedback.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3,
                max_tokens: 1500,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${error}`);
        }

        const data = await response.json();
        const analysis = data.choices[0].message.content;

        return parseAIResponse(analysis, 'gpt-4o-mini');
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        // Fallback to basic review
        return generateBasicReview(prTitle, prDescription, files);
    }
}

/**
 * Analyze with Anthropic Claude
 */
async function analyzeWithAnthropic(
    prTitle: string,
    prDescription: string,
    files: PRFile[],
    diff: string
): Promise<ReviewResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        throw new Error('Anthropic API key not configured');
    }

    const prompt = buildAnalysisPrompt(prTitle, prDescription, files, diff);

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1500,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API error: ${error}`);
        }

        const data = await response.json();
        const analysis = data.content[0].text;

        return parseAIResponse(analysis, 'claude-3-5-sonnet');
    } catch (error) {
        console.error('Error calling Anthropic:', error);
        // Fallback to basic review
        return generateBasicReview(prTitle, prDescription, files);
    }
}

/**
 * Build analysis prompt
 */
function buildAnalysisPrompt(
    prTitle: string,
    prDescription: string,
    files: PRFile[],
    diff: string
): string {
    const filesSummary = files
        .map(f => `- ${f.filename} (+${f.additions}/-${f.deletions})`)
        .join('\n');

    // Truncate diff if too long (keep first 10000 chars)
    const truncatedDiff = diff.length > 10000
        ? diff.substring(0, 10000) + '\n\n... (diff truncated for brevity)'
        : diff;

    return `Please review this pull request and provide a structured analysis.

**Pull Request Title:** ${prTitle}

**Description:** ${prDescription || 'No description provided'}

**Files Changed:**
${filesSummary}

**Diff:**
\`\`\`diff
${truncatedDiff}
\`\`\`

Please provide your review in the following format:

**SUMMARY:**
[A brief 2-3 sentence summary of what this PR does]

**HIGHLIGHTS:**
- [Positive aspects, good practices, well-implemented features]
- [List 2-4 items]

**CONCERNS:**
- [Potential issues, bugs, or problems to address]
- [List any concerns, or write "None" if there are no concerns]

**SUGGESTIONS:**
- [Recommendations for improvements]
- [List 2-4 items, or write "None" if no suggestions]

Keep your review constructive, specific, and helpful.`;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(response: string, model: string): ReviewResult {
    const sections = {
        summary: '',
        highlights: [] as string[],
        concerns: [] as string[],
        suggestions: [] as string[],
    };

    // Extract sections using regex
    const summaryMatch = response.match(/\*\*SUMMARY:\*\*\s*([\s\S]*?)(?=\*\*HIGHLIGHTS:|$)/i);
    const highlightsMatch = response.match(/\*\*HIGHLIGHTS:\*\*\s*([\s\S]*?)(?=\*\*CONCERNS:|$)/i);
    const concernsMatch = response.match(/\*\*CONCERNS:\*\*\s*([\s\S]*?)(?=\*\*SUGGESTIONS:|$)/i);
    const suggestionsMatch = response.match(/\*\*SUGGESTIONS:\*\*\s*([\s\S]*?)$/i);

    if (summaryMatch) {
        sections.summary = summaryMatch[1].trim();
    }

    if (highlightsMatch) {
        sections.highlights = extractBulletPoints(highlightsMatch[1]);
    }

    if (concernsMatch) {
        sections.concerns = extractBulletPoints(concernsMatch[1]);
    }

    if (suggestionsMatch) {
        sections.suggestions = extractBulletPoints(suggestionsMatch[1]);
    }

    return {
        summary: sections.summary || 'AI analysis completed.',
        highlights: sections.highlights,
        concerns: sections.concerns,
        suggestions: sections.suggestions,
        aiModel: model,
    };
}

/**
 * Extract bullet points from text
 */
function extractBulletPoints(text: string): string[] {
    const lines = text.split('\n');
    const points: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
            const point = trimmed.substring(1).trim();
            if (point && point.toLowerCase() !== 'none') {
                points.push(point);
            }
        }
    }

    return points;
}

/**
 * Generate basic review without AI (fallback)
 */
function generateBasicReview(
    prTitle: string,
    prDescription: string,
    files: PRFile[]
): ReviewResult {
    const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
    const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);
    const filesChanged = files.length;

    const summary = `This pull request modifies ${filesChanged} file${filesChanged !== 1 ? 's' : ''} with ${totalAdditions} addition${totalAdditions !== 1 ? 's' : ''} and ${totalDeletions} deletion${totalDeletions !== 1 ? 's' : ''}.`;

    const highlights = [
        `Changes ${filesChanged} file${filesChanged !== 1 ? 's' : ''}`,
        `Net change: ${totalAdditions - totalDeletions > 0 ? '+' : ''}${totalAdditions - totalDeletions} lines`,
    ];

    return {
        summary,
        highlights,
        concerns: [],
        suggestions: ['Consider adding AI-powered review by configuring an AI provider (OpenAI or Anthropic) in your environment variables.'],
        aiModel: 'basic-analysis',
    };
}

/**
 * Format review as GitHub comment
 */
export function formatReviewComment(review: ReviewResult): string {
    let comment = `## 🤖 AI Code Review\n\n`;

    comment += `### Summary\n${review.summary}\n\n`;

    if (review.highlights.length > 0) {
        comment += `### ✨ Highlights\n`;
        review.highlights.forEach(h => {
            comment += `- ${h}\n`;
        });
        comment += `\n`;
    }

    if (review.concerns.length > 0) {
        comment += `### ⚠️ Concerns\n`;
        review.concerns.forEach(c => {
            comment += `- ${c}\n`;
        });
        comment += `\n`;
    }

    if (review.suggestions.length > 0) {
        comment += `### 💡 Suggestions\n`;
        review.suggestions.forEach(s => {
            comment += `- ${s}\n`;
        });
        comment += `\n`;
    }

    comment += `---\n*Powered by PullPilot • AI Model: ${review.aiModel}*`;

    return comment;
}
