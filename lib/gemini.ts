/**
 * Gemini AI API Service
 * 
 * This module provides integration with Google's Gemini AI API for pull request analysis.
 * Follows the same patterns as the existing OpenAI and Anthropic integrations.
 */

interface GeminiGenerateContentRequest {
    contents: {
        role: 'user' | 'model';
        parts: { text: string }[];
    }[];
    generationConfig?: {
        temperature?: number;
        maxOutputTokens?: number;
        topP?: number;
        topK?: number;
    };
    systemInstruction?: {
        parts: { text: string }[];
    };
}

interface GeminiCandidate {
    content: {
        parts: { text: string }[];
        role: string;
    };
    finishReason: string;
}

interface GeminiResponse {
    candidates: GeminiCandidate[];
    usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}

export interface GeminiConfig {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
}

const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_OUTPUT_TOKENS = 1500;

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
}

/**
 * Get the Gemini API key from environment variables
 */
function getApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY environment variable.');
    }
    return apiKey;
}

/**
 * Generate content using Gemini API
 */
export async function generateContent(
    prompt: string,
    config?: GeminiConfig
): Promise<string> {
    const apiKey = getApiKey();
    const model = config?.model ?? DEFAULT_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestBody: GeminiGenerateContentRequest = {
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt }],
            },
        ],
        generationConfig: {
            temperature: config?.temperature ?? DEFAULT_TEMPERATURE,
            maxOutputTokens: config?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
        },
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Gemini API returned no candidates');
    }

    const candidate = data.candidates[0];
    if (!candidate.content?.parts?.[0]?.text) {
        throw new Error('Gemini API returned empty response');
    }

    return candidate.content.parts[0].text;
}

/**
 * Generate content with system instruction using Gemini API
 */
export async function generateContentWithSystem(
    systemInstruction: string,
    prompt: string,
    config?: GeminiConfig
): Promise<string> {
    const apiKey = getApiKey();
    const model = config?.model ?? DEFAULT_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestBody: GeminiGenerateContentRequest = {
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt }],
            },
        ],
        generationConfig: {
            temperature: config?.temperature ?? DEFAULT_TEMPERATURE,
            maxOutputTokens: config?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
        },
        systemInstruction: {
            parts: [{ text: systemInstruction }],
        },
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Gemini API returned no candidates');
    }

    const candidate = data.candidates[0];
    if (!candidate.content?.parts?.[0]?.text) {
        throw new Error('Gemini API returned empty response');
    }

    return candidate.content.parts[0].text;
}

/**
 * Generate a chat completion with conversation history
 */
export async function generateChat(
    messages: { role: 'user' | 'model'; content: string }[],
    config?: GeminiConfig
): Promise<string> {
    const apiKey = getApiKey();
    const model = config?.model ?? DEFAULT_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
    }));

    const requestBody: GeminiGenerateContentRequest = {
        contents,
        generationConfig: {
            temperature: config?.temperature ?? DEFAULT_TEMPERATURE,
            maxOutputTokens: config?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
        },
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Gemini API returned no candidates');
    }

    const candidate = data.candidates[0];
    if (!candidate.content?.parts?.[0]?.text) {
        throw new Error('Gemini API returned empty response');
    }

    return candidate.content.parts[0].text;
}
