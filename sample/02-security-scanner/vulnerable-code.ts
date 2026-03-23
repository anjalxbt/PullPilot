/**
 * ⚠️ SAMPLE FILE FOR TESTING ONLY - Contains intentional security vulnerabilities
 * DO NOT use this code in production!
 */

// 🔴 CRITICAL: SQL Injection vulnerability
export function getUserByName(db: any, name: string) {
  const query = `SELECT * FROM users WHERE name = '${name}'`;
  return db.query(query);
}

// 🟠 HIGH: eval() usage - arbitrary code execution
export function processInput(userInput: string) {
  const result = eval(userInput);
  return result;
}

// 🟠 HIGH: XSS vulnerability - innerHTML with unsanitized input
export function renderUserContent(content: string) {
  const element = document.createElement('div');
  element.innerHTML = content;  // XSS risk
  return element;
}

// 🟡 MEDIUM: Insecure HTTP URL
export async function fetchData() {
  const response = await fetch('http://api.example.com/sensitive-data');
  return response.json();
}

// 🟡 MEDIUM: Weak crypto usage
import * as crypto from 'crypto';
export function hashPassword(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex');
}

// 🟢 LOW: Console.log with sensitive data
export function processPayment(cardNumber: string, amount: number) {
  console.log(`Processing payment: card=${cardNumber}, amount=${amount}`);
  // ... payment logic
}
