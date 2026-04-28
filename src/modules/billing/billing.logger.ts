export const billingLogger = {
  paymentCreated: (log: any, data: any) => {
    log.info({
      event: "payment_created",
      ...data,
    });
  },

  paymentApproved: (log: any, data: any) => {
    log.info({
      event: "payment_approved",
      ...data,
    });
  },

  paymentRejected: (log: any, data: any) => {
    log.warn({
      event: "payment_rejected",
      ...data,
    });
  },

  creditsAdded: (log: any, data: any) => {
    log.info({
      event: "credits_added",
      ...data,
    });
  },

  creditConsumed: (log: any, data: any) => {
    log.info({
      event: "credit_consumed",
      ...data,
    });
  },
};