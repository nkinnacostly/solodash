import { createClient, createPublicClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Recursively delete files under a storage prefix; log errors, never throw. */
async function deleteStorageFolder(
  admin: ReturnType<typeof createPublicClient>,
  bucket: string,
  folderPath: string,
) {
  try {
    const { data: items, error } = await admin.storage
      .from(bucket)
      .list(folderPath, { limit: 1000 });

    if (error) {
      console.error(`[account/delete] list ${bucket}/${folderPath}:`, error);
      return;
    }

    if (!items?.length) return;

    const filePaths: string[] = [];

    for (const item of items) {
      const path = `${folderPath}/${item.name}`;
      const isFile =
        item.metadata != null &&
        typeof (item.metadata as { size?: unknown }).size === "number";
      if (isFile) {
        filePaths.push(path);
      } else {
        await deleteStorageFolder(admin, bucket, path);
      }
    }

    if (filePaths.length > 0) {
      const { error: removeError } = await admin.storage
        .from(bucket)
        .remove(filePaths);
      if (removeError) {
        console.error(`[account/delete] remove ${bucket}:`, removeError);
      }
    }
  } catch (e) {
    console.error(`[account/delete] storage ${bucket}/${folderPath}:`, e);
  }
}

export async function DELETE() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const adminSupabase = createPublicClient();

  const { data: userContracts, error: contractsFetchError } =
    await adminSupabase.from("contracts").select("id").eq("user_id", userId);

  if (contractsFetchError) {
    console.error("[account/delete] contracts fetch:", contractsFetchError);
  }

  const contractIds = (userContracts ?? []).map((c) => c.id);

  // Step 1 — storage (service role); never throw
  await deleteStorageFolder(adminSupabase, "logos", `logos/${userId}`);
  await deleteStorageFolder(
    adminSupabase,
    "documents",
    `invoices/${userId}`,
  );

  for (const contractId of contractIds) {
    await deleteStorageFolder(
      adminSupabase,
      "documents",
      `contracts/${contractId}`,
    );
  }

  const logDb = (step: string, err: unknown) =>
    console.error(`[account/delete] db ${step}:`, err);

  // Step 2 — database (service role bypasses RLS, e.g. profiles has no DELETE policy)
  const { data: invoiceRows, error: invoicesSelectError } =
    await adminSupabase.from("invoices").select("id").eq("user_id", userId);

  if (invoicesSelectError) {
    logDb("invoices select", invoicesSelectError);
  }

  const invoiceIds = (invoiceRows ?? []).map((r) => r.id);

  if (invoiceIds.length > 0) {
    const { error: paymentsError } = await adminSupabase
      .from("payments")
      .delete()
      .in("invoice_id", invoiceIds);
    if (paymentsError) logDb("payments", paymentsError);
  }

  const { error: incomeLogError } = await adminSupabase
    .from("income_log")
    .delete()
    .eq("user_id", userId);
  if (incomeLogError) logDb("income_log", incomeLogError);

  if (invoiceIds.length > 0) {
    const { error: itemsError } = await adminSupabase
      .from("invoice_items")
      .delete()
      .in("invoice_id", invoiceIds);
    if (itemsError) logDb("invoice_items", itemsError);
  }

  const { error: invoicesError } = await adminSupabase
    .from("invoices")
    .delete()
    .eq("user_id", userId);
  if (invoicesError) logDb("invoices", invoicesError);

  const { error: contractsError } = await adminSupabase
    .from("contracts")
    .delete()
    .eq("user_id", userId);
  if (contractsError) logDb("contracts", contractsError);

  const { error: clientsError } = await adminSupabase
    .from("clients")
    .delete()
    .eq("user_id", userId);
  if (clientsError) logDb("clients", clientsError);

  const { error: profilesError } = await adminSupabase
    .from("profiles")
    .delete()
    .eq("id", userId);
  if (profilesError) logDb("profiles", profilesError);

  // Step 3 — auth user (required to succeed)
  const { error: authError } =
    await adminSupabase.auth.admin.deleteUser(userId);

  if (authError) {
    console.error("[account/delete] auth delete:", authError);
    return NextResponse.json(
      { error: authError.message || "Failed to delete account" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
