
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

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'DEV' | 'USER';
  status: 'ACTIVE' | 'INACTIVE';
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

export type ViewState = 'DASHBOARD' | 'LIST' | 'DETAIL' | 'USERS';
