import { NextRequest, NextResponse } from "next/server";
import { auth, FrappeSession } from "@/lib/auth";

function getFrappeUrl() {
  const configuredUrl = (process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "");
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost" &&
    configuredUrl.startsWith("http://127.0.0.1:")
  ) {
    return configuredUrl.replace("http://127.0.0.1:", "http://localhost:");
  }
  return configuredUrl;
}

export async function GET(request: NextRequest) {
  try {
    // We can extract Frappe cookies from the request headers to forward them.
    const cookieHeader = request.headers.get("cookie") || "";
    
    // Auth check via forwarding cookie to candidate_auth.me
    const authRes = await fetch(`${getFrappeUrl()}/api/method/recruitment.api.candidate_auth.me`, {
      headers: { "cookie": cookieHeader }
    });
    const authData = await authRes.json();
    const user = authData.message?.user;
    
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Now safely fetch the pre-offer form for the authenticated user
    const formRes = await fetch(
      `${getFrappeUrl()}/api/method/recruitment.api.candidate_portal.get_pre_offer_form?job_applicant_id=${encodeURIComponent(user.email)}`, 
      { headers: { "cookie": cookieHeader } }
    );
    
    if (!formRes.ok) {
      return NextResponse.json({ error: "Failed to fetch form from Frappe" }, { status: formRes.status });
    }
    
    const formData = await formRes.json();
    return NextResponse.json(formData);

  } catch (error) {
    console.error("GET /api/pre-offer error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    
    // Authenticate
    const authRes = await fetch(`${getFrappeUrl()}/api/method/recruitment.api.candidate_auth.me`, {
      headers: { "cookie": cookieHeader }
    });
    const authData = await authRes.json();
    const user = authData.message?.user;
    
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the submission payload
    const body = await request.json();
    const { stepData } = body;
    
    if (!stepData) {
      return NextResponse.json({ error: "stepData is required" }, { status: 400 });
    }

    // Server-side validation: Re-fetch the form config to get editable fields and applicant ID
    const formRes = await fetch(
      `${getFrappeUrl()}/api/method/recruitment.api.candidate_portal.get_pre_offer_form?job_applicant_id=${encodeURIComponent(user.email)}`, 
      { headers: { "cookie": cookieHeader } }
    );
    
    const formData = await formRes.json();
    const formMessage = formData.message;
    
    if (!formMessage || formMessage.status !== "success") {
      return NextResponse.json({ error: "Could not retrieve pre-offer form to validate fields" }, { status: 400 });
    }

    const jobApplicantId = formMessage.job_applicant;
    if (!jobApplicantId) {
      return NextResponse.json({ error: "Job Applicant ID not found" }, { status: 400 });
    }

    // Build a set of editable fields from the form config
    const editableFields = new Set<string>();
    for (const tab of formMessage.tabs || []) {
      for (const section of tab.sections || []) {
        for (const field of section.fields || []) {
          // If the field is NOT marked as read-only, it is editable
          if (!field.read_only) {
            editableFields.add(field.fieldname);
          }
        }
      }
    }

    // Construct the mapped data, allowing ONLY editable fields
    const mappedData: Record<string, unknown> = {
      pre_offer_form_status: "Submitted",
      custom_email: user.email,
      submission_date: new Date().toISOString().split("T")[0],
    };

    for (const stepValues of Object.values(stepData as Record<string, Record<string, unknown>>)) {
      for (const [key, val] of Object.entries(stepValues)) {
        if (val === undefined) continue;
        
        // Enforce strict data submission rules
        if (editableFields.has(key)) {
          mappedData[key] = val;
        }
      }
    }

    const payload = {
      job_applicant_id: jobApplicantId,
      data: mappedData,
    };

    // Forward the secured payload to Frappe
    const submitRes = await fetch(`${getFrappeUrl()}/api/method/recruitment.api.candidate_portal.save_pre_offer_form_data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cookie": cookieHeader
      },
      body: JSON.stringify(payload),
    });

    const submitData = await submitRes.json();
    if (!submitRes.ok || (submitData.message && submitData.message.status !== "success")) {
      return NextResponse.json(submitData, { status: submitRes.status || 400 });
    }

    return NextResponse.json(submitData);

  } catch (error) {
    console.error("POST /api/pre-offer error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
