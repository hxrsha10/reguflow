
export interface ComplianceTask {
  task: string;
  description: string;
}

export interface Regulation {
  name: string;
  description: string;
}

export interface ComplianceData {
  applicableRegulations: Regulation[];
  complianceObligations: string[];
  actionableTaskChecklist: ComplianceTask[];
  requiredDocuments: string[];
  deadlinesFrequency: string[];
  riskFlags: string[];
  monitoringSuggestions: string[];
  isGrounded?: boolean;
  groundingSources?: Array<{ title: string; uri: string }>;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  scenario: string;
  data: ComplianceData;
  completedTasks: string[];
}

export enum UserTier {
  FREE = 'FREE',
  PRO = 'PRO'
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
