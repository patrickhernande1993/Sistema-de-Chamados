
export enum BillStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

export enum BillCategory {
  HOUSING = 'HOUSING',     // Aluguel, Condomínio
  UTILITIES = 'UTILITIES', // Luz, Água, Internet
  FOOD = 'FOOD',           // Mercado, Ifood
  TRANSPORT = 'TRANSPORT', // Uber, Gasolina
  LEISURE = 'LEISURE',     // Lazer
  HEALTH = 'HEALTH',       // Saúde
  OTHER = 'OTHER'
}

// Exported types to fix build errors in UserManagement.tsx
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

export interface FinanceAnalysis {
  isExpensive: boolean;
  savingsTip: string;
  categoryInsight: string;
  sentimentLabel: 'Good' | 'Warning' | 'Bad';
}

export interface Bill {
  id: string;
  userId: string; // Relacionado ao user.id do Supabase
  title: string;
  amount: number;
  category: BillCategory;
  status: BillStatus;
  dueDate: string; // YYYY-MM-DD
  paidDate?: string; // YYYY-MM-DD
  notes?: string;
  attachmentUrl?: string;
  aiAnalysis?: FinanceAnalysis;
  createdAt: string;
}

// Alias 'Ticket' to 'Bill' so legacy components (Notifications, etc) can compile without rewrite
export type Ticket = Bill;

// Exported type to fix build errors in Notifications.tsx
export interface Notification {
  id: string;
  recipientEmail: string;
  ticketId: string; // Refers to Bill ID
  message: string;
  read: boolean;
  createdAt: string;
}

export type ViewState = 'DASHBOARD' | 'LIST' | 'DETAIL' | 'USERS' | 'NOTIFICATIONS';
