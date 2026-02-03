/**
 * Groq AI API Service
 * 
 * This module provides integration with Groq's AI API for pull request analysis.
 * Groq uses an OpenAI-compatible API format.
 */

export interface GroqConfig {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 1500;

/**
 * Check if Groq API is configured
 */
export function isGroqConfigured(): boolean {
    return !!process.env.GROQ_API_KEY;
}

/**
 * Get the Groq API key from environment variables
 */
function getApiKey(): string {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('Groq API key not configured. Please set GROQ_API_KEY environment variable.');
    }
    return apiKey;
}

/**
 * Generate content using Groq API
 */
export async function generateContent(
    prompt: string,
    config?: GroqConfig
): Promise<string> {
    const apiKey = getApiKey();
    const model = config?.model ?? DEFAULT_MODEL;
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: config?.temperature ?? DEFAULT_TEMPERATURE,
            max_tokens: config?.maxTokens ?? DEFAULT_MAX_TOKENS,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
        throw new Error('Groq API returned no choices');
    }

    const choice = data.choices[0];
    if (!choice.message?.content) {
        throw new Error('Groq API returned empty response');
    }

    return choice.message.content;
}

/**
 * Generate content with system instruction using Groq API
 */
export async function generateContentWithSystem(
    systemInstruction: string,
    prompt: string,
    config?: GroqConfig
): Promise<string> {
    const apiKey = getApiKey();
    const model = config?.model ?? DEFAULT_MODEL;
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: 'system',
                    content: systemInstruction,
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: config?.temperature ?? DEFAULT_TEMPERATURE,
            max_tokens: config?.maxTokens ?? DEFAULT_MAX_TOKENS,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
        throw new Error('Groq API returned no choices');
    }

    const choice = data.choices[0];
    if (!choice.message?.content) {
        throw new Error('Groq API returned empty response');
    }

    return choice.message.content;
}
