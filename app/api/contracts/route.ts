import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTemplateById } from "@/lib/contract-templates";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: contracts, error } = await supabase
      .from("contracts")
      .select(
        `
        *,
        clients (
          name,
          email
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ contracts: contracts || [] });
  } catch (error: any) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch contracts" },
      { status: 500 }
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

    // Check plan limits: free users max 1 contract/month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

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
        { error: "Free plan limit reached. Upgrade to Pro for unlimited contracts." },
        { status: 403 }
      );
    }

    // Create client if new
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
        { status: 400 }
      );
    }

    // Get template and generate content
    const template = getTemplateById(templateId);

    if (!template) {
      return NextResponse.json(
        { error: "Invalid template" },
        { status: 400 }
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

    // Insert contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        user_id: user.id,
        client_id: finalClientId,
        title: `${template.name} - ${contractData.clientName}`,
        type: template.type,
        status,
        content: contractContent,
        template_id: templateId,
        start_date: contractData.startDate,
        end_date: contractData.endDate || null,
        value: contractData.projectFee || contractData.retainerFee || contractData.hourlyRate || 0,
        currency: contractData.currency || "USD",
      })
      .select()
      .single();

    if (contractError) throw contractError;

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create contract" },
      { status: 500 }
    );
  }
}
