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
  packageId?: string;
  clientPackageId?: string;
  packageName?: string;
  packagePrice?: string;
}

export interface SessionStructuredNoteDto {
  id: string;
  sessionId?: string;
  clientId: string;
  templateId?: number;
  noteType: string;
  source?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientNoteDto {
  id: string;
  clientId: string;
  sessionId?: string;
  type: string;
  content: string;
  source?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClientDetailEngagementDto {
  id: string;
  packageId?: string;
  clientPackageId?: string;
  name: string;
  startDate?: string;
  endDate?: string;
  price?: number;
  totalSessions: number;
  usedSessions: number;
  status: string;
  sessions: SessionDto[];
}

export interface ClientTimelineEntryDto {
  id: string;
  entryType: 'session' | 'note';
  category: string;
  sessionId?: string;
  createdAt: string;
  content: string;
  session?: SessionDto;
}

export interface ClientDetailViewDto {
  nextStep?: {
    sessionId: string;
    date: string;
    sessionType: string;
    location: string;
  } | null;
  engagements: ClientDetailEngagementDto[];
  timeline: ClientTimelineEntryDto[];
  clientNotes: ClientNoteDto[];
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
  clientId?: string;
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

export interface TemplateFieldDto {
  id: number;
  label: string;
  sortOrder: number;
  fieldType?: string;
}

export interface TemplateDto {
  id: string;
  name: string;
  description?: string;
  practiceId?: number;
  sourcePresetId?: number;
  createdAt?: string;
  fields: string[];
  fieldsDetail?: TemplateFieldDto[];
  custom?: boolean;
}
