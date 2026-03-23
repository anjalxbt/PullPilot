/**
 * ⚠️ SAMPLE FILE FOR TESTING ONLY - Contains intentional security vulnerabilities
 * DO NOT use this code in production!
 */

// 🔴 CRITICAL: Hardcoded API key
const API_KEY = "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234";

// 🔴 CRITICAL: Hardcoded database password
const DB_PASSWORD = "super_secret_password_123";

// 🟠 HIGH: Hardcoded AWS credentials
const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

// 🟡 MEDIUM: Private key material
const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...";

export function getConfig() {
  return {
    apiKey: API_KEY,
    dbPassword: DB_PASSWORD,
    awsAccessKey: AWS_ACCESS_KEY,
    awsSecretKey: AWS_SECRET_KEY,
  };
}
