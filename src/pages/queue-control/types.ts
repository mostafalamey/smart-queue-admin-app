export interface Department {
  id: string;
  nameEn: string;
  nameAr: string;
}

export interface Service {
  id: string;
  nameEn: string;
  nameAr: string;
  ticketPrefix: string;
  estimatedWaitMinutes: number | null;
}

export interface NowServingTicket {
  id: string;
  ticketNumber: string;
  status: "CALLED" | "SERVING";
  serviceId: string;
  stationId?: string;
  priorityWeight: number;
  calledAt?: string;
  servingStartedAt?: string;
  completedAt?: string;
  createdAt: string;
  originTicketId?: string;
  patientPhone: string;
}

export interface QueueSummary {
  requestId: string;
  serviceId: string;
  waitingCount: number;
  calledCount: number;
  servingCount: number;
  completedToday: number;
  noShowsToday: number;
  nowServing?: NowServingTicket;
}

export interface WaitingTicket {
  id: string;
  ticketNumber: string;
  priorityWeight: number;
  createdAt: string;
  /** Present in aggregate (department/all) views to identify the source service. */
  serviceName?: string;
}

export interface WaitingListResponse {
  requestId: string;
  tickets: WaitingTicket[];
}

/* ── Ticket search / detail types ──────────────────────────────────────── */

export interface TicketSearchResult {
  id: string;
  ticketNumber: string;
  phoneNumber: string;
  status: string;
  serviceId: string;
  serviceName: { en: string; ar: string };
  departmentId: string;
  departmentName: { en: string; ar: string };
  priorityWeight: number;
  priorityCategory: { code: string; nameEn: string; nameAr: string };
  createdAt: string;
  calledAt: string | null;
  servingStartedAt: string | null;
  completedAt: string | null;
}

export interface TicketEvent {
  id: string;
  eventType: string;
  actorType: string;
  actorName: string | null;
  actorUserId: string | null;
  stationId: string | null;
  payload: Record<string, unknown> | null;
  occurredAt: string;
}

export interface TicketDetail {
  id: string;
  ticketNumber: string;
  phoneNumber: string;
  status: string;
  sequenceNumber: number;
  serviceId: string;
  serviceName: { en: string; ar: string };
  departmentId: string;
  departmentName: { en: string; ar: string };
  priorityWeight: number;
  priorityCategory: { code: string; nameEn: string; nameAr: string };
  calledAt: string | null;
  servingStartedAt: string | null;
  completedAt: string | null;
  noShowAt: string | null;
  cancelledAt: string | null;
  calledCounterStationId: string | null;
  lockedByUserId: string | null;
  lockedUntil: string | null;
  originTicketId: string | null;
  createdAt: string;
  updatedAt: string;
  events: TicketEvent[];
}

export interface PriorityCategory {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  weight: number;
}
