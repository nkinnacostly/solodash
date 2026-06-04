/**
 * One-off script to sanitize all existing contract HTML in the database.
 *
 * Run with:
 *   npx tsx scripts/sanitize-existing-contracts.ts
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Safe to run multiple times (sanitization is idempotent).
 */

import { createClient } from "@supabase/supabase-js";
import { sanitizeContractHtml } from "../lib/sanitize-html";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing required env vars:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL");
  console.error("  SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log("Fetching all contracts...");

  // Determine which column the contract content is stored in.
  // The codebase has both `content` and `content_html` references.
  // Check both.

  const { data: contracts, error } = await supabase
    .from("contracts")
    .select("id, content, content_html");

  if (error) {
    console.error("Failed to fetch contracts:", error);
    process.exit(1);
  }

  if (!contracts || contracts.length === 0) {
    console.log("No contracts found. Nothing to do.");
    return;
  }

  console.log(`Found ${contracts.length} contracts. Sanitizing...`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors: { id: string; error: string }[] = [];

  for (const contract of contracts) {
    const updates: Record<string, string> = {};
    let needsUpdate = false;

    if (contract.content) {
      const sanitized = sanitizeContractHtml(contract.content);
      if (sanitized !== contract.content) {
        updates.content = sanitized;
        needsUpdate = true;
      }
    }

    if (contract.content_html) {
      const sanitized = sanitizeContractHtml(contract.content_html);
      if (sanitized !== contract.content_html) {
        updates.content_html = sanitized;
        needsUpdate = true;
      }
    }

    if (!needsUpdate) {
      skippedCount++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("contracts")
      .update(updates)
      .eq("id", contract.id);

    if (updateError) {
      errorCount++;
      errors.push({ id: contract.id, error: updateError.message });
      console.error(
        `✗ Failed to update ${contract.id}: ${updateError.message}`,
      );
    } else {
      updatedCount++;
      console.log(`✓ Sanitized contract ${contract.id}`);
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Total contracts:    ${contracts.length}`);
  console.log(`Updated:            ${updatedCount}`);
  console.log(`Already clean:      ${skippedCount}`);
  console.log(`Errors:             ${errorCount}`);

  if (errors.length > 0) {
    console.log("\nErrors:");
    errors.forEach((e) => console.log(`  ${e.id}: ${e.error}`));
    process.exit(1);
  }

  console.log("\n✅ All contracts sanitized successfully.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
