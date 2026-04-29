export type CreatePaymentDTO = {
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  type: "PREPAID" | "SUBSCRIPTION";
  status: "PENDING" | "APPROVED" | "REJECTED";
  provider: string;
  externalId: string;
  idempotencyKey: string;
};

export type UpdatePaymentDTO = {
  externalId?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  providerResponse?: any;
  payerEmail?: string;
  payerDocument?: string;
  fees?: number;
};