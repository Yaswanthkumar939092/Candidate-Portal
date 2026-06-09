export interface PostLoginRouteStep {
  key: string;
  label: string;
  status: string;
  redirect_url: string;
}

export interface BasePostLoginRouteResponse {
  current_step: string | null;
  steps: PostLoginRouteStep[];
  next_step: string | null;
}

export interface SurveyRequiredResponse extends BasePostLoginRouteResponse {
  survey_required: true;
  form_name: string;
  form_schema: Record<string, any>;
  job_applicant: string;
  job_opening: string;
}

export interface SurveyNotRequiredResponse extends BasePostLoginRouteResponse {
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
