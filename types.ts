
export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum TicketCategory {
  BUG = 'BUG',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  BILLING = 'BILLING',
  SUPPORT = 'SUPPORT',
  OTHER = 'OTHER'
}

export type UserRole = 'DEV' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
}

export interface AIAnalysis {
  suggestedPriority: TicketPriority;
  suggestedCategory: TicketCategory;
  sentimentScore: number; // 0 to 100
  sentimentLabel: 'Positive' | 'Neutral' | 'Negative';
  summary: string;
  suggestedReply: string;
}

export interface TicketMessage {
  id: string;
  sender: 'USER' | 'AGENT' | 'AI';
  content: string;
  timestamp: string;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  requester: string;
  ownerEmail: string; // Used to filter tickets by user
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  aiAnalysis?: AIAnalysis;
  messages: TicketMessage[];
  attachments?: Attachment[];
}

export interface Notification {
  id: string;
  recipientEmail: string;
  ticketId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type ViewState = 'DASHBOARD' | 'LIST' | 'DETAIL' | 'USERS' | 'NOTIFICATIONS';
