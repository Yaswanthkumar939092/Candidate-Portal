export interface SurveyRequiredResponse {
  survey_required: true;
  form_name: string;
  form_schema: Record<string, any>;
  job_applicant: string;
  job_opening: string;
}

export interface SurveyNotRequiredResponse {
  survey_required: false;
  redirect_url: string;
}

export type PostLoginRouteResponse = SurveyRequiredResponse | SurveyNotRequiredResponse;

export interface SubmitSurveyPayload {
  job_applicant: string;
  job_opening: string;
  response: Record<string, any>;
}

export interface SubmitSurveyResponse {
  status: string;
  message?: string;
  redirect_url?: string;
}
