import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyWebhookSignature } from '../webhook-verify';

// ── Helpers ───────────────────────────────────────────────────
/** Compute a valid GitHub-style sha256 HMAC signature */
function sign(payload: string, secret: string): string {
    return 'sha256=' + crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

// ── verifyWebhookSignature ────────────────────────────────────
describe('verifyWebhookSignature', () => {
    const SECRET = 'super-secret-key';
    const PAYLOAD = JSON.stringify({ action: 'opened', number: 42 });

    it('returns true for a valid signature', () => {
        const signature = sign(PAYLOAD, SECRET);
        expect(verifyWebhookSignature(PAYLOAD, signature, SECRET)).toBe(true);
    });

    it('returns false when payload is tampered', () => {
        const signature = sign(PAYLOAD, SECRET);
        const tampered = PAYLOAD + ' '; // even a tiny change invalidates the HMAC
        expect(verifyWebhookSignature(tampered, signature, SECRET)).toBe(false);
    });

    it('returns false when secret is wrong', () => {
        const signature = sign(PAYLOAD, 'wrong-secret');
        expect(verifyWebhookSignature(PAYLOAD, signature, SECRET)).toBe(false);
    });

    it('returns false when signature is empty string', () => {
        expect(verifyWebhookSignature(PAYLOAD, '', SECRET)).toBe(false);
    });

    it('returns false when secret is empty string', () => {
        const signature = sign(PAYLOAD, SECRET);
        expect(verifyWebhookSignature(PAYLOAD, signature, '')).toBe(false);
    });

    it('returns false for a truncated/wrong-length signature', () => {
        // A hash truncated to half-length has a different byte count — timingSafeEqual
        // throws on mismatched buffer sizes, and the impl catches that and returns false.
        const fullHash = crypto.createHmac('sha256', SECRET).update(PAYLOAD, 'utf8').digest('hex');
        const truncated = 'sha256=' + fullHash.slice(0, 20); // too short
        expect(verifyWebhookSignature(PAYLOAD, truncated, SECRET)).toBe(false);
    });

    it('returns false for a completely invalid signature string', () => {
        expect(verifyWebhookSignature(PAYLOAD, 'sha256=not-hex-at-all!!!', SECRET)).toBe(false);
    });

    it('returns true for an empty payload with correct signature', () => {
        const emptyPayload = '';
        const signature = sign(emptyPayload, SECRET);
        expect(verifyWebhookSignature(emptyPayload, signature, SECRET)).toBe(true);
    });

    it('correctly handles large payloads', () => {
        const largePayload = 'x'.repeat(100_000);
        const signature = sign(largePayload, SECRET);
        expect(verifyWebhookSignature(largePayload, signature, SECRET)).toBe(true);
    });

    it('is case-sensitive for secrets', () => {
        const signature = sign(PAYLOAD, SECRET);
        expect(verifyWebhookSignature(PAYLOAD, signature, SECRET.toUpperCase())).toBe(false);
    });
});
