export type SessionLocationValue = 'zoom' | 'phone' | 'office';
export type SessionStatusValue = 'upcoming' | 'completed' | 'cancelled' | 'noShow';
export type SessionEntryMode = 'schedule' | 'logPast';
export type BillingModelValue = 'payPerSession' | 'monthly' | 'package';
export type SessionBillingModeValue = BillingModelValue;
export type PaymentStatusValue = 'paid' | 'pending' | 'unpaid';

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
  billingModel: BillingModelValue;
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
  location: SessionLocationValue;
  status: SessionStatusValue;
  payment?: string;
  paymentStatus?: PaymentStatusValue;
  billingSource?: 'pay-per-session' | 'monthly' | 'package';
  paymentAmount?: number;
  paymentDate?: string;
  paymentMethod?: string;
  packageRemaining?: number;
  focus: string;
  notes?: string;
  packageId?: string;
  clientPackageId?: string;
  packageName?: string;
  packagePrice?: number;
  invoiceId?: string;
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
  scheduledSessions: number;
  cancelledSessions: number;
  availableSessions: number;
  paymentStatus?: PaymentStatusValue;
  paymentAmount?: number;
  paymentDate?: string;
  paymentMethod?: string;
  status: 'active' | 'fullyScheduled' | 'completed' | 'paused' | string;
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
  unpaidMtd: number;
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
  paidCount?: number;
  dueCount?: number;
}

export interface BillingSettingsDto {
  defaultDueDays: number;
  defaultSessionAmount: number;
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
  sessionCount: number;
  description: string;
}

export interface BillingPaymentDto {
  id: string;
  sourceType: 'session' | 'package';
  sourceId: string;
  clientId: string;
  clientName: string;
  clientInitials: string;
  clientColor: string;
  description: string;
  amount: number;
  paymentStatus: PaymentStatusValue;
  billingSource: 'pay-per-session' | 'monthly' | 'package';
  serviceDate: string;
  paymentDate?: string;
  paymentMethod?: string;
}

export interface ClientPackageDto {
  id: string;
  packageId: string;
  packageName: string;
  purchasedAt: string;
  totalSessions: number;
  remainingSessions: number;
  scheduledSessions: number;
  usedSessions: number;
  cancelledSessions: number;
  paymentAmount?: number;
  paymentStatus?: PaymentStatusValue;
  paymentDate?: string;
  paymentMethod?: string;
  price?: number;
  status: 'active' | 'fullyScheduled' | 'completed';
}

export interface PracticePackageDto {
  id: string;
  name: string;
  sessionCount: number;
  price: number;
  status: string;
  enabled: boolean;
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

export interface NotesTemplateSettingsDto {
  templateMode: 'default' | 'template';
  selectedTemplateKind?: 'preset' | 'custom';
  selectedTemplateId?: string;
}
