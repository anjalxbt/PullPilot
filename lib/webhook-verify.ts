import crypto from 'crypto';

/**
 * Verify GitHub webhook signature
 * @param payload - Raw request body as string
 * @param signature - GitHub signature from X-Hub-Signature-256 header
 * @param secret - Webhook secret
 * @returns boolean indicating if signature is valid
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    if (!signature || !secret) {
        return false;
    }

    // GitHub sends signature as "sha256=<hash>"
    const signatureHash = signature.replace('sha256=', '');

    // Calculate expected signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const expectedHash = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signatureHash, 'hex'),
            Buffer.from(expectedHash, 'hex')
        );
    } catch (error) {
        // If buffers are different lengths, timingSafeEqual throws
        return false;
    }
}
