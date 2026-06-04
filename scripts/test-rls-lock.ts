/**
 * Verifies migration 003: authenticated users cannot update protected profile columns.
 *
 * Prerequisites:
 *   - Migration 003 applied to your Supabase project
 *   - .env.local (or env) with:
 *       SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *       SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY
 *       TEST_USER_EMAIL
 *       TEST_USER_PASSWORD
 *
 * Run:
 *   npx tsx scripts/test-rls-lock.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const testEmail = process.env.TEST_USER_EMAIL;
const testPassword = process.env.TEST_USER_PASSWORD;

function fail(message: string): never {
  console.error(`\n❌ FAIL: ${message}\n`);
  process.exit(1);
}

function pass(message: string): void {
  console.log(`\n✅ PASS: ${message}\n`);
  process.exit(0);
}

async function main() {
  if (!supabaseUrl || !supabaseAnonKey) {
    fail(
      "Missing SUPABASE_URL and SUPABASE_ANON_KEY (or NEXT_PUBLIC_* equivalents).",
    );
  }

  if (!testEmail || !testPassword) {
    fail(
      "Missing TEST_USER_EMAIL and TEST_USER_PASSWORD for sign-in.",
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log("Signing in as test user...");
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

  if (signInError || !signInData.user) {
    fail(`Sign-in failed: ${signInError?.message ?? "no user returned"}`);
  }

  const userId = signInData.user.id;
  console.log(`Signed in as ${testEmail} (${userId})`);

  console.log("Attempting direct plan update (should be blocked by trigger)...");

  const { data, error } = await supabase
    .from("profiles")
    .update({ plan: "pro" })
    .eq("id", userId)
    .select("plan");

  if (!error) {
    console.error("Update unexpectedly succeeded:", data);
    fail(
      "Authenticated client was able to set plan = 'pro'. Trigger may not be applied.",
    );
  }

  const errText = `${error.message} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  const code = error.code ?? "";

  const looksBlocked =
    code === "42501" ||
    code === "insufficient_privilege" ||
    errText.includes("insufficient_privilege") ||
    errText.includes("direct updates to plan") ||
    errText.includes("use billing api");

  if (looksBlocked) {
    pass(
      `Direct plan update was blocked as expected.\n   Error: ${error.message} (code: ${error.code ?? "n/a"})`,
    );
  }

  fail(
    `Update failed but not with expected trigger message.\n   Got: ${error.message} (code: ${error.code ?? "n/a"})`,
  );
}

main().catch((err) => {
  console.error(err);
  fail(err instanceof Error ? err.message : "Unexpected error");
});
