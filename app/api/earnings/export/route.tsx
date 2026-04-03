import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import React from "react";

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
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString(),
    );
    const format = searchParams.get("format") || "csv";

    const { data: entries, error } = await supabase
      .from("income_log")
      .select(
        `
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
      `,
      )
      .eq("user_id", user.id)
      .gte("date", `${year}-01-01`)
      .lt("date", `${year + 1}-01-01`)
      .order("date", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch earnings" },
        { status: 500 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, business_name, currency")
      .eq("id", user.id)
      .single();

    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);

    const clientMap = new Map<
      string,
      { client_name: string; count: number; total: number }
    >();

    entries.forEach((entry) => {
      const client = entry.clients as any;
      const clientId = entry.client_id || "manual";
      const clientName = client?.name || "Manual Entry";

      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
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
      (a, b) => b.total - a.total,
    );

    if (format === "csv") {
      const csvRows = [
        ["Date", "Invoice/Description", "Client", "Amount", "Currency", "Type"],
        ...entries.map((entry) => {
          const client = entry.clients as any;
          return [
            new Date(entry.date).toLocaleDateString("en-US"),
            entry.description,
            client?.name || "Manual Entry",
            entry.amount.toFixed(2),
            entry.currency,
            entry.type === "invoice_payment"
              ? "Invoice Payment"
              : "Manual Entry",
          ];
        }),
        [],
        ["Total", "", "", total.toFixed(2), profile?.currency || "NGN", ""],
      ];

      const csvContent = csvRows
        .map((row) =>
          row
            .map((cell) => {
              const cellStr = String(cell);
              return cellStr.includes(",") || cellStr.includes('"')
                ? `"${cellStr.replace(/"/g, '""')}"`
                : cellStr;
            })
            .join(","),
        )
        .join("\n");

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="paidly-earnings-${year}.csv"`,
        },
      });
    }

    if (format === "pdf") {
      const { Document, Page, Text, View, StyleSheet } =
        await import("@react-pdf/renderer");

      const { renderToBuffer } = await import("@react-pdf/renderer");

      const styles = StyleSheet.create({
        page: { padding: 40, fontFamily: "Helvetica" },
        header: { marginBottom: 30 },
        title: {
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 8,
          color: "#10b981",
        },
        subtitle: { fontSize: 12, color: "#666", marginBottom: 4 },
        totalSection: {
          backgroundColor: "#f0fdf4",
          padding: 20,
          borderRadius: 8,
          marginBottom: 30,
        },
        totalLabel: { fontSize: 12, color: "#666", marginBottom: 4 },
        totalAmount: { fontSize: 32, fontWeight: "bold", color: "#10b981" },
        section: { marginBottom: 20 },
        sectionTitle: {
          fontSize: 16,
          fontWeight: "bold",
          marginBottom: 12,
          color: "#1a1a1a",
        },
        table: { width: "100%" },
        tableHeader: {
          flexDirection: "row",
          borderBottomWidth: 2,
          borderBottomColor: "#27272a",
          paddingBottom: 8,
          marginBottom: 4,
        },
        tableRow: {
          flexDirection: "row",
          paddingBottom: 8,
          marginBottom: 4,
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
        },
        col1: { flex: 2, fontSize: 10, color: "#1a1a1a" },
        col2: { flex: 1, fontSize: 10, color: "#666", textAlign: "right" },
        col3: {
          flex: 1,
          fontSize: 10,
          color: "#10b981",
          fontWeight: "bold",
          textAlign: "right",
        },
        footer: {
          marginTop: 40,
          paddingTop: 20,
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          textAlign: "center",
        },
        footerText: { fontSize: 10, color: "#999" },
      });

      const getCurrencySymbol = (currency: string) => {
        const symbols: Record<string, string> = {
          USD: "$",
          GBP: "£",
          EUR: "€",
          NGN: "NGN ",
          GHS: "GHS ",
          KES: "KSh ",
          ZAR: "R",
        };
        return symbols[currency] || currency + " ";
      };

      const currencySymbol = getCurrencySymbol(profile?.currency || "NGN");

      const MyDocument = () =>
        React.createElement(
          Document,
          null,
          React.createElement(
            Page,
            { size: "A4", style: styles.page },
            React.createElement(
              View,
              { style: styles.header },
              React.createElement(
                Text,
                { style: styles.title },
                `Annual Income Summary ${year}`,
              ),
              React.createElement(
                Text,
                { style: styles.subtitle },
                profile?.business_name || profile?.name || "",
              ),
              React.createElement(
                Text,
                { style: styles.subtitle },
                `Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
              ),
            ),
            React.createElement(
              View,
              { style: styles.totalSection },
              React.createElement(
                Text,
                { style: styles.totalLabel },
                "Total Income",
              ),
              React.createElement(
                Text,
                { style: styles.totalAmount },
                `${currencySymbol}${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
              ),
            ),
            byClient.length > 0
              ? React.createElement(
                  View,
                  { style: styles.section },
                  React.createElement(
                    Text,
                    { style: styles.sectionTitle },
                    "Income by Client",
                  ),
                  React.createElement(
                    View,
                    { style: styles.table },
                    React.createElement(
                      View,
                      { style: styles.tableHeader },
                      React.createElement(
                        Text,
                        { style: styles.col1 },
                        "Client",
                      ),
                      React.createElement(
                        Text,
                        { style: styles.col2 },
                        "Invoices",
                      ),
                      React.createElement(
                        Text,
                        { style: styles.col3 },
                        "Total",
                      ),
                    ),
                    ...byClient.map((client, idx) =>
                      React.createElement(
                        View,
                        { key: idx, style: styles.tableRow },
                        React.createElement(
                          Text,
                          { style: styles.col1 },
                          client.client_name,
                        ),
                        React.createElement(
                          Text,
                          { style: styles.col2 },
                          String(client.count),
                        ),
                        React.createElement(
                          Text,
                          { style: styles.col3 },
                          `${currencySymbol}${client.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                        ),
                      ),
                    ),
                  ),
                )
              : null,
            React.createElement(
              View,
              { style: styles.section },
              React.createElement(
                Text,
                { style: styles.sectionTitle },
                "All Transactions",
              ),
              React.createElement(
                View,
                { style: styles.table },
                React.createElement(
                  View,
                  { style: styles.tableHeader },
                  React.createElement(Text, { style: styles.col1 }, "Date"),
                  React.createElement(
                    Text,
                    { style: styles.col2 },
                    "Description",
                  ),
                  React.createElement(Text, { style: styles.col3 }, "Amount"),
                ),
                ...entries.map((entry, idx) =>
                  React.createElement(
                    View,
                    { key: idx, style: styles.tableRow },
                    React.createElement(
                      Text,
                      { style: styles.col1 },
                      new Date(entry.date).toLocaleDateString("en-US"),
                    ),
                    React.createElement(
                      Text,
                      { style: styles.col2 },
                      entry.description,
                    ),
                    React.createElement(
                      Text,
                      { style: styles.col3 },
                      `${getCurrencySymbol(entry.currency)}${entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                    ),
                  ),
                ),
              ),
            ),
            React.createElement(
              View,
              { style: styles.footer },
              React.createElement(
                Text,
                { style: styles.footerText },
                "Generated by Paidly · getpaidly.co",
              ),
              React.createElement(
                Text,
                { style: styles.footerText },
                "Paidly provides income data only. Consult a tax professional for filing guidance.",
              ),
            ),
          ),
        );

      const pdfBuffer = await renderToBuffer(React.createElement(MyDocument));

      return new NextResponse(pdfBuffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="paidly-earnings-${year}.pdf"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid format. Use 'pdf' or 'csv'" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error exporting earnings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export earnings" },
      { status: 500 },
    );
  }
}
