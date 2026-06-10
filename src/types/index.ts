// ─── Re-export Prisma enums ────────────────────────────────────────────────────
export type {
  UserRole,
  IssueCategory,
  Confidence,
  RiskLevel,
  WorkflowStatus,
  SystemCheck,
  TicketChannel,
  SessionStatus,
  TagCategory,
  TemplateType,
  EmailMode,
  DocCategory,
  Difficulty,
} from '@prisma/client';

// ─── Issue category display labels ────────────────────────────────────────────
export const ISSUE_LABELS: Record<string, string> = {
  RETURN_EXCHANGE: 'Return / Exchange',
  REPLACEMENT_ORDER: 'Replacement Order',
  DAMAGED_DEFECTIVE: 'Damaged / Defective Item',
  WRONG_ITEM_RECEIVED: 'Wrong Item Received',
  MISSING_ITEM: 'Missing Item',
  CUSTOMER_WRONG_SIZE: 'Customer Ordered Wrong Size',
  CUSTOMIZED_ITEM_RETURN: 'Customized Item Return',
  ORDER_STATUS_ETA: 'Order Status / ETA',
  PROCESSING_TIME: 'Processing Time',
  EXPEDITED_SHIPPING: 'Expedited Shipping',
  TRACKING_NOT_MOVING: 'Tracking Not Moving',
  FBB_TRACKING: 'FBB Tracking',
  PARTIAL_SHIPMENT: 'Partially Shipped Order',
  OUT_OF_STOCK: 'Out of Stock',
  ORDER_CHANGE: 'Order Change',
  ORDER_CANCELLATION: 'Order Cancellation',
  OBD_WAVE: 'OBD / Wave',
  FBPA_CANCELLATION: 'FBPA Cancellation',
  FBB_CHANGE_CANCELLATION: 'FBB Change / Cancellation',
  TEAM_STORE_PASSWORD: 'Team Store Password',
  PLAYER_LINK: 'Player Link',
  GUEST_CHECKOUT: 'Guest Checkout / Account Linking',
  INDIVIDUAL_ITEM_ORDERING: 'Individual Item Ordering',
  TWO_PLAYERS_ONE_ACCOUNT: 'Two Players Under One Account',
  SIZE_HELP: 'Size Help',
  PRODUCT_TECHNICAL: 'Product Technical Question',
  WEBSITE_ISSUE: 'Website Issue',
  REFUND_REQUEST: 'Refund Request',
  PRIVATE_CONTACT_INFO: 'Private Contact Info Request',
  ESCALATION: 'Escalation',
  GENERAL_INQUIRY: 'General Inquiry',
};

export const SYSTEM_LABELS: Record<string, string> = {
  ZENDESK: 'Zendesk',
  BIGCOMMERCE: 'BigCommerce',
  SHOPIFY: 'Shopify (capellisport.com)',
  SAP: 'SAP',
  TEAM_STORE: 'Team Store',
  CONTACT_SHEET: 'Contact Sheet',
  PRODUCT_DIRECTORY: 'Product Development Directory',
  ZENDESK_TAGS_SHEET: 'Zendesk Tags Sheet',
};

// ─── AI Analysis Result ────────────────────────────────────────────────────────
export interface AnalysisResult {
  issue_summary: string;
  primary_issue_type: string;
  secondary_issue_types: string[];
  confidence_score: number;
  risk_level: 'low' | 'medium' | 'high';
  workflow_recommended: string;
  missing_information: MissingInfoItem[];
  systems_to_check: SystemCheckItem[];
  policy_to_apply: string;
  step_by_step_actions: WorkflowAction[];
  customer_email_draft: string;
  email_subject: string;
  internal_note_draft: string;
  zendesk_tags: ZendeskTagSuggestion[];
  ticket_status: 'Open' | 'Pending' | 'On-hold' | 'Solved';
  pre_send_checklist: PreSendCheckItem[];
  source_references: SourceRef[];
  escalation_needed: boolean;
  escalation_reason: string;
  escalation_contact: string;
  agent_warnings: AgentWarning[];
  do_rules: string[];
  dont_rules: string[];
  decision_path: string[];
}

export interface MissingInfoItem {
  field: string;
  reason: string;
  how_to_get: string;
  is_required: boolean;
}

export interface SystemCheckItem {
  system: string;
  what_to_check: string;
  why: string;
  priority: 'first' | 'second' | 'optional';
}

export interface WorkflowAction {
  step: number;
  title: string;
  action: string;
  warning?: string;
  is_gate?: boolean;
}

export interface ZendeskTagSuggestion {
  tag: string;
  category: string;
  is_required: boolean;
  is_official: boolean;
  note?: string;
}

export interface PreSendCheckItem {
  key: string;
  label: string;
  is_required: boolean;
  warning?: string;
}

export interface SourceRef {
  document_name: string;
  section: string;
  page_number: number | null;
  relevant_rule: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED';
  quote?: string;
}

export interface AgentWarning {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  rule?: string;
}

// ─── Workflow types ────────────────────────────────────────────────────────────
export interface WorkflowCard {
  id: string;
  workflowId: string;
  name: string;
  category: string;
  triggerPhrases: string[];
  whenToUse: string[];
  doNotUseWhen: string[];
  requiredInfo: string[];
  systemChecks: string[];
  status: string;
  version: number;
  stepCount: number;
  hasTemplate: boolean;
  updatedAt: Date;
}

export interface FullWorkflow extends WorkflowCard {
  steps: {
    stepNumber: number;
    title: string;
    description: string;
    agentAction: string | null;
    warning: string | null;
    isRequired: boolean;
  }[];
  customerEmailTemplate: string | null;
  internalNoteTemplate: string | null;
  zendeskTags: { tagName: string; tagCategory: string; isRequired: boolean }[];
  escalationRules: { triggerReason: string; escalateTo: string | null; details: string }[];
  commonMistakes: string[];
  sourceRefs: { documentName: string; sectionName: string | null; relevantRule: string; confidence: string }[];
}

// ─── Ticket Coach session state ────────────────────────────────────────────────
export interface TicketInput {
  complaint: string;
  orderNumber?: string;
  clubTeamName?: string;
  agentNotes?: string;
  channel?: string;
  screenshotDescription?: string;
}

export interface CoachSession {
  id: string;
  input: TicketInput;
  analysis: AnalysisResult | null;
  currentStep: number;
  completedChecks: Record<string, boolean>;
  emailEdited: string | null;
  noteEdited: string | null;
  isLoading: boolean;
  error: string | null;
}

// ─── Dashboard analytics ────────────────────────────────────────────────────
export interface DashboardMetrics {
  totalSessions: number;
  sessionsTodayCount: number;
  avgConfidence: number;
  escalationRate: number;
  topIssues: { category: string; count: number }[];
  recentSessions: {
    id: string;
    agentName: string;
    issue: string;
    risk: string;
    status: string;
    createdAt: Date;
  }[];
  missingInfoFrequency: { field: string; count: number }[];
  workflowUsage: { workflow: string; count: number }[];
  uncertainQueries: number;
}

// ─── Knowledge Base ────────────────────────────────────────────────────────────
export interface KBSearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentCategory: string;
  content: string;
  sectionHeading: string | null;
  pageNumber: number | null;
  similarity: number;
  isSensitive: boolean;
}
