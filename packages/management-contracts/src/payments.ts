import { FoundationStatus, type FoundationStatusCode } from '@ehas2/shared';
import type { CurrencyCode } from './dashboard.js';

/**
 * Provider-neutral payment / earnings read models.
 * Management Admin cannot mark payment successful without verified provider evidence.
 * No fake revenue in this phase.
 */
export type SubscriptionSummary = {
  subscriptionId: string;
  doctorId: string;
  planId: string;
  status: 'TRIAL' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'NOT_CONNECTED';
  currency: CurrencyCode;
  amountMinor: number | null;
  dataSourceStatus: FoundationStatusCode;
};

export type PaymentSummary = {
  paymentId: string;
  subscriptionId: string | null;
  doctorId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'NOT_CONNECTED';
  currency: CurrencyCode;
  amountMinor: number | null;
  providerEvidencePresent: boolean;
  dataSourceStatus: FoundationStatusCode;
};

export type PaymentFailure = {
  paymentId: string;
  doctorId: string;
  failureCode: string;
  failureClass: 'provider' | 'network' | 'user' | 'unknown' | 'not_connected';
  occurredAt: string | null;
  dataSourceStatus: FoundationStatusCode;
};

export type RefundSummary = {
  refundId: string;
  paymentId: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'NOT_CONNECTED';
  currency: CurrencyCode;
  amountMinor: number | null;
  requiresApproval: true;
  dataSourceStatus: FoundationStatusCode;
};

export type RevenueSummary = {
  periodLabel: string;
  currency: CurrencyCode;
  grossMinor: number | null;
  providerFeesMinor: number | null;
  refundsMinor: number | null;
  netMinor: number | null;
  dataSourceStatus: FoundationStatusCode;
  note: string;
};

export type MonthlyEarning = {
  yearMonth: string;
  currency: CurrencyCode;
  grossMinor: number | null;
  netMinor: number | null;
  dataSourceStatus: FoundationStatusCode;
};

export type SettlementSummary = {
  settlementId: string;
  periodLabel: string;
  currency: CurrencyCode;
  amountMinor: number | null;
  dataSourceStatus: FoundationStatusCode;
};

export type InvoiceSummary = {
  invoiceId: string;
  doctorId: string;
  currency: CurrencyCode;
  amountMinor: number | null;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID' | 'NOT_CONNECTED';
  dataSourceStatus: FoundationStatusCode;
};

export type ManualPaymentAdjustment = {
  adjustmentId: string;
  paymentId: string;
  actorId: string;
  reason: string;
  requiresPermission: true;
  requiresAudit: true;
  providerEvidenceRequired: true;
  status: typeof FoundationStatus.NOT_IMPLEMENTED;
};

export function createNotConnectedRevenueSummary(periodLabel = 'current_month'): RevenueSummary {
  return {
    periodLabel,
    currency: 'INR',
    grossMinor: null,
    providerFeesMinor: null,
    refundsMinor: null,
    netMinor: null,
    dataSourceStatus: FoundationStatus.NOT_CONNECTED,
    note: 'Management services are not connected.',
  };
}
