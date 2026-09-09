export type Risk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Finding {
  type: string;
  severity: string;
  text: string;
}

export interface Project {
  [key: string]: any;
  project_id: string;
  state: string;
  district: string;
  work_type: string;
  work_description: string;
  risk_score: number;
  risk_level: Risk;
  flagged_reasons: Finding[];
  similar_projects: any[];
}
