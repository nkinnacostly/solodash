import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/log-redact";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10)),
    );
    const year = parseInt(
      url.searchParams.get("year") || String(new Date().getFullYear()),
      10,
    );

    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: entries, error: entriesError, count } = await supabase
      .from("income_log")
      .select(
        `
        id,
        amount,
        currency,
        type,
        description,
        date,
        invoice_id,
        client_id,
        clients (
          name
        )
      `,
        { count: "exact" },
      )
      .eq("user_id", user.id)
      .gte("date", yearStart)
      .lte("date", yearEnd)
      .order("date", { ascending: false })
      .range(from, to);

    if (entriesError) throw entriesError;

    const formattedEntries = (entries || []).map((entry) => {
      const client = Array.isArray(entry.clients)
        ? entry.clients[0]
        : entry.clients;
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

    const includeStats =
      page === 1 || url.searchParams.get("includeStats") === "true";

    let stats: {
      totalEarned: number;
      year: number;
      currency: string;
    } | null = null;
    let monthlyBreakdown: { month: number; total: number }[] | null = null;
    let clientBreakdown:
      | {
          client_id: string | null;
          client_name: string | null;
          total: number;
          invoice_count: number;
        }[]
      | null = null;

    if (includeStats) {
      const { data: yearTotal, error: totalError } = await supabase.rpc(
        "sum_income_for_year",
        {
          p_user_id: user.id,
          p_year: year,
        },
      );

      if (totalError) throw totalError;

      const { data: profile } = await supabase
        .from("profiles")
        .select("currency")
        .eq("id", user.id)
        .single();

      stats = {
        totalEarned: Number(yearTotal ?? 0),
        year,
        currency: profile?.currency || "USD",
      };

      const { data: monthly, error: monthlyError } = await supabase.rpc(
        "get_monthly_income",
        {
          p_user_id: user.id,
          p_year: year,
        },
      );

      if (monthlyError) throw monthlyError;

      monthlyBreakdown = (monthly || []).map(
        (row: { month: number; total: number }) => ({
          month: row.month,
          total: Number(row.total),
        }),
      );

      const { data: byClient, error: clientError } = await supabase.rpc(
        "get_income_by_client",
        {
          p_user_id: user.id,
          p_year: year,
        },
      );

      if (clientError) throw clientError;

      clientBreakdown = (byClient || []).map(
        (row: {
          client_id: string | null;
          client_name: string | null;
          total: number;
          invoice_count: number;
        }) => ({
          client_id: row.client_id,
          client_name: row.client_name,
          total: Number(row.total),
          invoice_count: Number(row.invoice_count),
        }),
      );
    }

    return NextResponse.json({
      entries: formattedEntries,
      stats,
      monthlyBreakdown,
      clientBreakdown,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
        hasMore: count ? from + pageSize < count : false,
      },
    });
  } catch (error: unknown) {
    console.error("[earnings] error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 },
    );
  }
}
