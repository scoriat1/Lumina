export interface ClientDto {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  program: string;
  progress: number;
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
  payment: string;
  paymentStatus?: 'paid' | 'unpaid' | 'invoiced' | 'package';
  billingSource?: 'pay-per-session' | 'package' | 'included';
  packageRemaining?: number;
  focus: string;
  notes?: string;
  isRecurring?: boolean;
  recurringType?: 'weekly' | 'biweekly' | 'monthly';
}

export interface DashboardDto {
  activeClients: number;
  sessionsThisMonth: number;
  revenueMtd: number;
  calendarFilledPercent: number;
  upcomingSessions: SessionDto[];
  activeClientPreview: ClientDto[];
}
