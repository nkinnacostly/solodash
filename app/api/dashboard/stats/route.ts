import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/log-redact";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const [
      yearTotalResult,
      monthEarningsResult,
      outstandingResult,
      activeContractsResult,
      profileResult,
    ] = await Promise.allSettled([
      supabase.rpc("sum_income_for_year", {
        p_user_id: user.id,
        p_year: currentYear,
      }),
      supabase
        .from("income_log")
        .select("amount")
        .eq("user_id", user.id)
        .gte("date", startOfMonth),
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["sent", "viewed", "overdue"]),
      supabase
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active"),
      supabase
        .from("profiles")
        .select("currency")
        .eq("id", user.id)
        .single(),
    ]);

    const yearlyTotal =
      yearTotalResult.status === "fulfilled"
        ? Number(yearTotalResult.value.data ?? 0)
        : 0;

    const monthRows =
      monthEarningsResult.status === "fulfilled"
        ? monthEarningsResult.value.data || []
        : [];

    const monthlyTotal = monthRows.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0,
    );

    const outstandingCount =
      outstandingResult.status === "fulfilled"
        ? outstandingResult.value.count || 0
        : 0;

    const activeContracts =
      activeContractsResult.status === "fulfilled"
        ? activeContractsResult.value.count || 0
        : 0;

    const currency =
      profileResult.status === "fulfilled"
        ? profileResult.value.data?.currency || "USD"
        : "USD";

    return NextResponse.json({
      monthlyTotal,
      yearlyTotal,
      outstandingCount,
      activeContracts,
      year: currentYear,
      currency,
    });
  } catch (error: unknown) {
    console.error("[dashboard/stats] error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
