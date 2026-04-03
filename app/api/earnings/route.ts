import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // Fetch all income_log entries for the year
    const { data: entries, error } = await supabase
      .from("income_log")
      .select(`
        id,
        date,
        amount,
        currency,
        description,
        type,
        client_id,
        clients (
          name
        )
      `)
      .eq("user_id", user.id)
      .gte("date", `${year}-01-01`)
      .lt("date", `${year + 1}-01-01`)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching income log:", error);
      return NextResponse.json(
        { error: "Failed to fetch earnings" },
        { status: 500 }
      );
    }

    // Fetch profile for default currency
    const { data: profile } = await supabase
      .from("profiles")
      .select("currency")
      .eq("id", user.id)
      .single();

    // Calculate totals
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);

    // Calculate by month
    const byMonth = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      amount: 0,
    }));

    entries.forEach((entry) => {
      const month = new Date(entry.date).getMonth() + 1;
      byMonth[month - 1].amount += entry.amount;
    });

    // Calculate by client
    const clientMap = new Map<
      string,
      { client_id: string | null; client_name: string; count: number; total: number }
    >();

    entries.forEach((entry) => {
      const client = entry.clients as any;
      const clientId = entry.client_id || "manual";
      const clientName = client?.name || "Manual Entry";

      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          client_id: entry.client_id,
          client_name: clientName,
          count: 0,
          total: 0,
        });
      }

      const existing = clientMap.get(clientId)!;
      existing.count += 1;
      existing.total += entry.amount;
    });

    const byClient = Array.from(clientMap.values()).sort(
      (a, b) => b.total - a.total
    );

    // Format entries
    const formattedEntries = entries.map((entry) => {
      const client = entry.clients as any;
      return {
        id: entry.id,
        date: entry.date,
        amount: entry.amount,
        currency: entry.currency,
        description: entry.description,
        type: entry.type,
        client_name: client?.name || null,
      };
    });

    return NextResponse.json({
      total,
      by_month: byMonth,
      by_client: byClient,
      entries: formattedEntries,
      currency: profile?.currency || "USD",
    });
  } catch (error: any) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
