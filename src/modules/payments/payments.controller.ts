import { FastifyRequest, FastifyReply } from "fastify";
import { PaymentService } from "./payments.service";

const service = new PaymentService();

export const paymentsController = {
  async getUserPayments(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    const { userId } = request.params;

    try {
      const payments = await service.getUserPayments(userId);

      request.log.info({
        event: "payments_fetched",
        userId,
        count: payments.length,
      });

      return reply.send(payments);
    } catch (error) {
      request.log.error({
        event: "payments_fetch_error",
        error,
        userId,
      });

      return reply.status(500).send({
        message: "Internal Server Error",
      });
    }
  },

  async getPaymentById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    try {
      const payment = await service.getPaymentById(id);

      if (!payment) {
        return reply.status(404).send({
          message: "Payment not found",
        });
      }

      return reply.send(payment);
    } catch (error) {
      request.log.error({
        event: "payment_fetch_error",
        error,
        paymentId: id,
      });

      return reply.status(500).send({
        message: "Internal Server Error",
      });
    }
  },
};