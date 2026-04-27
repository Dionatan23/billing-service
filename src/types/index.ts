export type LogEvent = {
  event: string;
  userId?: string;
  planSlug?: string;
  paymentId?: string;
  status?: string;
  amount?: number;
  error?: string;
  metadata?: Record<string, any>;
};