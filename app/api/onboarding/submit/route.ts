import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/middleware/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ONBOARDING_STEPS } from '@/lib/validation/onboarding-schemas'

function mapOnboardingDataToFrappe(onboardingData: Record<string, unknown>, userEmail: string) {
  const p = (onboardingData.personal_info as Record<string, unknown>) || {}
  const a = (onboardingData.address as Record<string, unknown>) || {}
  const currAddr = (a.current_address as Record<string, unknown>) || {}
  const permAddr = (a.permanent_address as Record<string, unknown>) || {}
  const i = (onboardingData.identity_documents as Record<string, unknown>) || {}
  const b = (onboardingData.bank_details as Record<string, unknown>) || {}
  const e = (onboardingData.emergency_contacts as Record<string, unknown>) || {}
  const edu = (onboardingData.education as Record<string, unknown>) || {}
  const emp = (onboardingData.employment_history as Record<string, unknown>) || {}

  const mappedData = {
    boarding_status: "Pending",
    date_of_joining: p.date_of_joining || new Date().toISOString().split('T')[0],
    boarding_begins_on: new Date().toISOString().split('T')[0],
    notify_users_by_email: 1,
    amended_from: "",
    custom_is_rehire: 0,
    custom_other_reason: "",
    custom_select_inactive_employee: "",
    custom_migrate_payroll_data: 0,
    custom_assign_back_reportees: 0,
    custom_reason_for_late_tat: "",
    
    custom_gender: p.gender || "",
    custom_blood_group: p.blood_group || "",
    custom_marital_status: p.marital_status || "",
    custom_languages_known: p.languages_known || "", 
    custom_fathers_full_name: (p.family_members && (p.family_members as Record<string, unknown>[])[0]) ? (p.family_members as Record<string, unknown>[])[0].name : "", 
    custom_spouse_name: "", 
    custom_mothers_full_name: "", 
    custom_children: "",
    
    custom_upload_resume: p.resume_url || "",
    custom_upload_passport_size_photo: p.photo_url || "",
    
    custom_enable_web_clockin: 1,
    custom_ip_restrictions: "",
    custom_use_shift_blocks: 0,
    custom_enable_check_in: 1,
    custom_break_entry: 1,
    custom_ctc: "",
    custom_monthly: 0,
    custom_currency: "INR",
    custom_self_service: "Yes",
    custom_email: userEmail,
    custom_first_name: p.first_name || "",
    custom_personal_email_id: p.personal_email || "",
    custom_middle_name: p.nationality || "",
    custom_primary_contact_number: p.phone || "",
    custom_date_of_birth: p.date_of_birth || "",
    custom_date_of_joining: p.date_of_joining || "",
    custom_last_name: p.last_name || "",
    custom_office_mobile_number: "",
    custom_auto_activate: "Yes",
    
    custom_current_flat__house__wing: currAddr.line1 || "",
    custom_current_landmark: "",
    custom_current_state: currAddr.state || "",
    custom_current_pincode: currAddr.pin_code || "",
    custom_current_street__locality__area: currAddr.line2 || "",
    custom_current_city: currAddr.city || "",
    custom_current_country: currAddr.country || "",
    custom_upload_address_proof: a.address_proof_url || "",
    
    custom_permanent_flat__house__wing: permAddr.line1 || "",
    custom_permanent_landmark: "",
    custom_permanent_state: permAddr.state || "",
    custom_permanent_pincode: permAddr.pin_code || "",
    custom_permanent_street__locality__area: permAddr.line2 || "",
    custom_permanent_city: permAddr.city || "",
    custom_permanent_country: permAddr.country || "",
    
    custom_pan_number: i.pan_number || "",
    custom_name_as_per_pan: i.name_as_per_pan || "", 
    custom_upload_pan_card: i.pan_document_url || "",
    custom_guardian_name: i.guardian_name || "",
    custom_date_of_birthpan: i.dob_pan || "",
    custom_aadhaar_number: i.aadhaar_number || "",
    custom_upload_aadhaarfront: i.aadhaar_document_url || "",
    custom_upload_aadhaarback: i.aadhaar_document_url || "", 
    
    custom_bank_name: b.bank_name || "",
    custom_account_number: b.account_number || "",
    custom_upload_cancelled_cheque_passbook_statement: b.cheque_document_url || "",
    custom_ifsc_code: b.ifsc_code || "",
    custom_uan_numberoptional: b.uan_number || "",
    
    custom_emergency_contact_name: (e.contacts && (e.contacts as Record<string, unknown>[])[0]) ? (e.contacts as Record<string, unknown>[])[0].name : "",
    custom_relationship: (e.contacts && (e.contacts as Record<string, unknown>[])[0]) ? (e.contacts as Record<string, unknown>[])[0].relationship : "",
    custom_contact_number: (e.contacts && (e.contacts as Record<string, unknown>[])[0]) ? (e.contacts as Record<string, unknown>[])[0].phone_number : "",
    
    custom_education_details: ((edu.qualifications as Record<string, unknown>[]) || []).map((q) => ({
      school_univ: q.institution || "",
      custom_university: q.institution || "",
      qualification: q.degree || "",
      custom_educational_details: q.specialization || "",
      level: "",
      year_of_passing: q.year_of_passing ? parseInt(q.year_of_passing as string) : null,
      custom_passing_year: q.year_of_passing || "",
      class_per: q.percentage_or_cgpa || "",
      maj_opt_subj: q.specialization || "",
      custom_attachmentt: q.document_url || "",
      custom_activities: "",
      custom_this_is_my_highest_education_qualification: 1, 
      custom_mode_of_learning: "Regular Full Time",
      custom_education_degree_naukri: q.degree || "",
      custom_education_category_naukri: "",
      custom_field_of_specialization_naukri: q.specialization || "",
      custom_percentage_naukri: q.percentage_or_cgpa || "",
      custom_employee_education: "",
      custom_educational_category: "",
      custom_education_degree: q.degree || "",
      custom_field_of_specialisation: q.specialization || "",
      custom_course_typedegree_type_: "Full Time",
      custom_max_gpapercentage: parseFloat(q.percentage_or_cgpa as string) || null,
      custom_i_am_currently_a_student: 0,
      custom_start_date: "",
      custom_completion_date: "",
      custom_educational_documents_proofs: q.document_url || "",
      custom_notes: "",
      custom_please_enter_your_marks_obtained: q.percentage_or_cgpa || "",
      custom_month__year_of_passing: q.year_of_passing || "",
      custom_course_typedegree_type: "Full Time",
      custom_registration_number: "",
      custom_educational_proof_degree: q.document_url || "",
      custom_to_date: "",
      custom_have_you_done_your_masters_from_iim: "No",
      custom_i_am_currently_pursuing_this_course: 0
    })),
    
    custom_employment_details_custom: ((emp.experiences as Record<string, unknown>[]) || []).map((exp) => ({
      company_name: exp.company || "",
      designation: exp.designation || "",
      from_date: exp.from_date || "",
      to_date: exp.to_date || "",
      address: ""
    })),
    
    custom_do_you_have__any_relatives_working_at_pw: "No"
  };

  return { email: userEmail, data: mappedData };
}

/**
 * POST /api/onboarding/submit
 *
 * Submit the onboarding data for review.
 * Validates that all required steps have data, then updates:
 * - onboarding_data.status => 'submitted'
 * - onboarding_data.submitted_at => now
 * - onboarding_data.declaration_accepted => true
 * - profiles.lifecycle_stage => 'onboarding'
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Fetch the current onboarding record
    const { data: onboardingData, error: fetchError } = await supabaseAdmin
      .from('onboarding_data')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !onboardingData) {
      return NextResponse.json(
        { error: 'Onboarding data not found. Please save your progress first.' },
        { status: 404 }
      )
    }

    // Verify that all required steps (1-7) have data
    const requiredSteps = ONBOARDING_STEPS.slice(0, 7) // exclude the review step itself
    const missingSteps: string[] = []

    for (const step of requiredSteps) {
      const stepValue = onboardingData[step.key as keyof typeof onboardingData]
      if (!stepValue || (typeof stepValue === 'object' && Object.keys(stepValue as object).length === 0)) {
        missingSteps.push(step.label)
      }
    }

    if (missingSteps.length > 0) {
      return NextResponse.json(
        {
          error: `The following steps are incomplete: ${missingSteps.join(', ')}`,
          missing_steps: missingSteps,
        },
        { status: 400 }
      )
    }

    // Update onboarding status to 'submitted'
    const { error: updateError } = await supabaseAdmin
      .from('onboarding_data')
      .update({
        status: 'submitted',
        declaration_accepted: true,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error submitting onboarding:', updateError)
      return NextResponse.json({ error: 'Failed to submit onboarding data' }, { status: 500 })
    }

    // Update the user's lifecycle stage to 'onboarding'
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        lifecycle_stage: 'onboarding',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Error updating profile lifecycle stage:', profileError)
      // Don't fail the submission over this; the onboarding data is already saved
    }

    // Call Frappe API
    const frappeUrl = process.env.NEXT_PUBLIC_FRAPPE_URL || 'http://localhost:8000';
    const frappeApiKey = process.env.FRAPPE_API_KEY || '';
    const frappeApiSecret = process.env.FRAPPE_API_SECRET || '';
    
    const userEmail = user.email || user.user_metadata?.email || user.identities?.[0]?.identity_data?.email || '';

    const payload = mapOnboardingDataToFrappe(onboardingData, userEmail);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (frappeApiKey && frappeApiSecret) {
        headers['Authorization'] = `token ${frappeApiKey}:${frappeApiSecret}`;
      }

      const frappeResponse = await fetch(`${frappeUrl}/api/method/recruitment.api.employee_onboarding.update_onboarding_details`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!frappeResponse.ok) {
        const errorText = await frappeResponse.text();
        console.error('Frappe API error:', errorText);
        return NextResponse.json({ error: 'Failed to sync with Frappe' }, { status: 502 });
      }
    } catch (frappeErr) {
      console.error('Frappe fetch error:', frappeErr);
      return NextResponse.json({ error: 'Failed to sync with Frappe API' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding submitted successfully',
    })
  } catch (error) {
    console.error('POST /api/onboarding/submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
