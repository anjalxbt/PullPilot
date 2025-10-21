/**
 * Robust GitHub API fetch utility that handles common Node.js fetch issues
 */

interface GitHubFetchOptions {
  accessToken: string;
  endpoint: string;
  method?: string;
  body?: any;
  retries?: number;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function githubFetch({ 
  accessToken, 
  endpoint, 
  method = 'GET',
  body,
  retries = 3
}: GitHubFetchOptions): Promise<any> {
  let lastError: any;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const url = endpoint.startsWith('http') 
        ? endpoint 
        : `https://api.github.com${endpoint}`;

      const options: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'PullPilot-App',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: controller.signal,
        cache: 'no-store',
      };

      if (body) {
        options.body = JSON.stringify(body);
        (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;
      
      // Enhanced error logging
      console.error(`GitHub API fetch error (attempt ${attempt + 1}/${retries}):`, {
        endpoint,
        error: error.message,
        cause: error.cause?.message || error.cause,
        code: error.cause?.code,
        errno: error.cause?.errno,
      });

      // Don't retry on auth errors or client errors
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
        throw error;
      }

      // Retry on network errors
      if (attempt < retries - 1) {
        const backoff = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`Retrying in ${backoff}ms...`);
        await sleep(backoff);
        continue;
      }
    }
  }

  throw lastError;
}
