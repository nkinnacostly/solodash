// Supabase Edge Function: send-invoice-job
//
// Triggered by POST /api/invoices/[id]/send (Next.js route).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM_EMAIL =
  Deno.env.get("RESEND_FROM_EMAIL") || "hello@getpaidly.co";
const APP_URL = Deno.env.get("APP_URL") || "https://www.getpaidly.co";
const PAIDLY_LINK_SECRET = Deno.env.get("PAIDLY_LINK_SECRET")!;

async function generateLinkToken(
  id: string,
  type: "pay" | "sign",
  expiryDays = 30,
): Promise<string> {
  const payload = {
    id,
    type,
    exp: Date.now() + expiryDays * 24 * 60 * 60 * 1000,
  };

  const payloadStr = base64url(JSON.stringify(payload));

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PAIDLY_LINK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sigBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadStr),
  );

  const signature = base64url(new Uint8Array(sigBytes));

  return `${payloadStr}.${signature}`;
}

function base64url(input: string | Uint8Array): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;

  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }

  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildEmailHtml(params: {
  freelancerName: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate: string;
  paymentUrl: string;
  clientName: string;
}) {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif;color:#e4e4e7;">
    <div style="max-width:560px;margin:40px auto;padding:32px;background:#111;border-radius:16px;border:1px solid #222;">
      <div style="margin-bottom:24px;">
        <span style="color:#10b981;font-size:22px;font-weight:700;">Paidly</span>
      </div>
      <h1 style="font-size:22px;margin:0 0 16px;color:#fff;">
        ${params.freelancerName} sent you an invoice
      </h1>
      <p style="font-size:15px;line-height:1.6;color:#a1a1aa;margin:0 0 24px;">
        Hi ${params.clientName},<br><br>
        You have a new invoice for <strong style="color:#fff;">${params.currency} ${params.amount}</strong>
        from ${params.freelancerName}.
      </p>
      <div style="background:#0a0a0a;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">
          Invoice
        </p>
        <p style="margin:0 0 16px;font-size:18px;color:#fff;font-weight:600;">
          ${params.invoiceNumber}
        </p>
        <p style="margin:0;font-size:13px;color:#71717a;">
          Due ${params.dueDate}
        </p>
      </div>
      <a href="${params.paymentUrl}"
         style="display:inline-block;padding:14px 28px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
        View & Pay Invoice →
      </a>
      <p style="margin-top:32px;font-size:12px;color:#52525b;">
        This payment link expires in 30 days. Powered by Paidly · ${APP_URL.replace("https://", "")}
      </p>
    </div>
  </body>
</html>`;
}

function clientRecord(
  clients:
    | { name?: string; email?: string }
    | { name?: string; email?: string }[]
    | null,
): { name?: string; email?: string } | null {
  if (!clients) return null;
  if (Array.isArray(clients)) return clients[0] ?? null;
  return clients;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let invoiceId: string;

  try {
    const body = await req.json();
    invoiceId = body.invoice_id;

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "invoice_id required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: invoice, error: invoiceErr } = await supabase
      .from("invoices")
      .select(
        `
        id, invoice_number, total, currency, due_date, user_id, client_id,
        clients ( name, email )
      `,
      )
      .eq("id", invoiceId)
      .single();

    if (invoiceErr || !invoice) {
      throw new Error("Invoice not found");
    }

    const client = clientRecord(
      invoice.clients as
        | { name?: string; email?: string }
        | { name?: string; email?: string }[]
        | null,
    );

    if (!client?.email) {
      throw new Error("Client email missing");
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("name, business_name")
      .eq("id", invoice.user_id)
      .single();

    if (profileErr || !profile) {
      throw new Error("Profile not found");
    }

    const freelancerName =
      profile.business_name || profile.name || "Your contractor";

    const token = await generateLinkToken(invoiceId, "pay");
    const paymentUrl = `${APP_URL.replace(/\/$/, "")}/pay/${invoiceId}?token=${encodeURIComponent(token)}`;

    const formattedAmount = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(invoice.total));

    const formattedDueDate = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "Not set";

    const emailHtml = buildEmailHtml({
      freelancerName,
      invoiceNumber: invoice.invoice_number,
      amount: formattedAmount,
      currency: invoice.currency,
      dueDate: formattedDueDate,
      paymentUrl,
      clientName: client.name || "there",
    });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${freelancerName} via Paidly <${RESEND_FROM_EMAIL}>`,
        to: client.email,
        subject: `Invoice ${invoice.invoice_number} from ${freelancerName}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      throw new Error(`Resend failed: ${emailResponse.status} ${errText}`);
    }

    const now = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from("invoices")
      .update({
        status: "sent",
        sent_at: now,
        payment_link: paymentUrl,
        updated_at: now,
      })
      .eq("id", invoiceId);

    if (updateErr) {
      console.error("Failed to update invoice to sent:", updateErr.message);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-invoice-job] failed:", (err as Error).message);

    await supabase
      .from("invoices")
      .update({
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .eq("status", "sending");

    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
