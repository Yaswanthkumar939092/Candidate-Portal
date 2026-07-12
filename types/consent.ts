export interface ConsentHeader {
  title: string;
  subtitle: string;
}

export interface ConsentInformationItem {
  [key: string]: string;
}

export interface ConsentStatement {
  consent_key: string;
  statement: string;
  fieldtype: "Check" | string;
  is_mandatory: number | boolean;
}

export interface ConsentDeclaration {
  heading: string;
  require_all_mandatory: number | boolean;
  statements: ConsentStatement[];
}

export interface ConsentAcknowledgementField {
  fieldname: string;
  label: string;
  fieldtype: "Data" | "Signature" | "Date" | string;
  is_mandatory: number | boolean;
}

export interface ConsentApplicant {
  name: string;
  email: string;
}

export interface ConsentFormResponse {
  enabled: boolean;
  enforce_before_onboarding: number | boolean;
  header: ConsentHeader;
  intro_content: string;
  information: ConsentInformationItem[];
  closing_content: string;
  declaration: ConsentDeclaration;
  acknowledgement: ConsentAcknowledgementField[];
  confirmation_note: string | null;
  applicant: ConsentApplicant;
  already_consented: boolean;
  consent_log: any;
}
