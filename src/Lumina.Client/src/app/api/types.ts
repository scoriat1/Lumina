export interface ClientDto {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  program: string;
  progress?: number;
  sessionsCompleted: number;
  totalSessions: number;
  nextSession?: string;
  status: 'active' | 'paused' | 'completed';
  email: string;
  phone: string;
  startDate: string;
  notes?: string;
}

export interface SessionDto {
  id: string;
  clientId: string;
  client: string;
  initials: string;
  avatarColor: string;
  sessionType: string;
  date: string;
  duration: number;
  location: 'zoom' | 'phone' | 'office';
  status: 'upcoming' | 'completed' | 'cancelled';
  payment?: string;
  paymentStatus?: 'paid' | 'unpaid' | 'invoiced' | 'package';
  billingSource?: 'pay-per-session' | 'package' | 'included';
  packageRemaining?: number;
  focus: string;
  notes?: string;
}

export interface DashboardDto {
  activeClients: number;
  sessionsThisMonth: number;
  revenueMtd: number;
  calendarFilledPercent: number;
  upcomingSessions: SessionDto[];
  activeClientPreview: ClientDto[];
}

export interface AuthMeDto {
  userId: string;
  email: string;
  displayName: string;
  initials: string;
  practiceId: string;
  providerId: string;
  role: string;
}

export interface BillingSummaryDto {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
}

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientInitials: string;
  clientColor: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  sessionCount: string;
  description: string;
}

export interface ProviderDto {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  initials: string;
  avatarColor: string;
}

export interface TemplateDto {
  id: string;
  name: string;
  description?: string;
  fields: string[];
  custom?: boolean;
}
