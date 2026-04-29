// services/applicantStatusService.ts

import { FrappeAPI } from "../frappe-api"

export interface ApplicantFlag {
    status: string
    flag: boolean
  }
  
  export interface ApplicantStatusData {
    id: string
    name: string
    status: string
    flags: ApplicantFlag[]
  }
  
  export interface ApplicantStatusResponse {
    message: {
      success: boolean
      data: ApplicantStatusData
    }
  }

  
 export const ApplicantStatusResponse= {
   // ✅ GET — fetch existing draft by email
   getApplicantStatusResponse: async (email: string): Promise<ApplicantStatusResponse> => {
     const response = await FrappeAPI.get("recruitment.api.employee_onboarding.get_applicant_status",
        {email: email}
     );
     return response as ApplicantStatusResponse ;
   },
}