import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTemplateById } from "@/lib/contract-templates";
import { sanitizeContractHtml } from "@/lib/sanitize-html";
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
    const status = url.searchParams.get("status");

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("contracts")
      .select(
        `
        id,
        title,
        type,
        status,
        value,
        currency,
        start_date,
        end_date,
        client_signed_at,
        freelancer_signed_at,
        created_at,
        client_id,
        clients (
          name,
          email
        )
      `,
        { count: "exact" },
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: contracts, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      contracts: contracts || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
        hasMore: count ? from + pageSize < count : false,
      },
    });
  } catch (error: unknown) {
    console.error("[contracts] error:", errorMessage(error));
    return NextResponse.json(
      { error: "Failed to fetch contracts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      templateId,
      clientId,
      isNewClient,
      clientName,
      clientEmail,
      clientAddress,
      contractData,
      status = "draft",
    } = body;

    const now = new Date();
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();

    const { count: monthlyCount } = await supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart);

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (profile?.plan === "free" && (monthlyCount || 0) >= 1) {
      return NextResponse.json(
        {
          error:
            "Free plan limit reached. Upgrade to Pro for unlimited contracts.",
        },
        { status: 403 },
      );
    }

    let finalClientId = clientId;

    if (isNewClient && clientName && clientEmail) {
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          name: clientName,
          email: clientEmail,
          address: clientAddress || null,
        })
        .select()
        .single();

      if (clientError) throw clientError;
      finalClientId = newClient.id;
    }

    if (!finalClientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 },
      );
    }

    const template = getTemplateById(templateId);

    if (!template) {
      return NextResponse.json(
        { error: "Invalid template" },
        { status: 400 },
      );
    }

    const contractContent = template.content({
      freelancerName: contractData.freelancerName,
      businessName: contractData.businessName,
      clientName: contractData.clientName,
      projectDescription: contractData.projectDescription,
      scopeOfWork: contractData.scopeOfWork,
      paymentTerms: contractData.paymentTerms,
      startDate: contractData.startDate,
      endDate: contractData.endDate,
      hourlyRate: contractData.hourlyRate,
      estimatedHours: contractData.estimatedHours,
      projectFee: contractData.projectFee,
      retainerFee: contractData.retainerFee,
      currency: contractData.currency,
      revisions: contractData.revisions,
      governingLaw: contractData.governingLaw || "Nigeria",
    });

    const safeContent = sanitizeContractHtml(contractContent);

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        user_id: user.id,
        client_id: finalClientId,
        title: `${template.name} - ${contractData.clientName}`,
        type: template.type,
        status,
        content: safeContent,
        template_id: templateId,
        start_date: contractData.startDate,
        end_date: contractData.endDate || null,
        value:
          contractData.projectFee ||
          contractData.retainerFee ||
          contractData.hourlyRate ||
          0,
        currency: contractData.currency || "USD",
      })
      .select()
      .single();

    if (contractError) throw contractError;

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error: unknown) {
    console.error("[contracts] create error:", errorMessage(error));
    const message =
      error instanceof Error ? error.message : "Failed to create contract";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
