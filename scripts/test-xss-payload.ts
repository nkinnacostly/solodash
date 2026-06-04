import { sanitizeContractHtml } from "../lib/sanitize-html";

const xssPayloads = [
  '<script>alert("xss")</script>',
  '<img src=x onerror="alert(1)">',
  '<a href="javascript:alert(1)">click</a>',
  '<iframe src="//attacker.com"></iframe>',
  '<div onclick="stealCookie()">click me</div>',
  '<svg onload="alert(1)">',
  '<style>body { background: url("javascript:alert(1)") }</style>',
];

console.log("Testing XSS sanitization...\n");

let allPassed = true;
for (const payload of xssPayloads) {
  const sanitized = sanitizeContractHtml(payload);
  const hasScript = /<script|onerror|onclick|javascript:|onload/i.test(
    sanitized
  );
  const status = hasScript ? "❌ FAIL" : "✅ PASS";

  if (hasScript) allPassed = false;

  console.log(`${status}:`);
  console.log(`  Input:  ${payload}`);
  console.log(`  Output: ${sanitized}\n`);
}

console.log(
  allPassed ? "✅ All payloads sanitized" : "❌ Some payloads got through"
);
process.exit(allPassed ? 0 : 1);
