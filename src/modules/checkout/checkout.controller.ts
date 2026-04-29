import { FastifyRequest, FastifyReply } from "fastify";
import { CheckoutService } from "./checkout.service";

const service = new CheckoutService();

export const checkoutController = {
  async createCheckout(
    request: FastifyRequest<{
      Body: { userId: string; planId: string };
    }>,
    reply: FastifyReply,
  ) {
    const { userId, planId } = request.body;

    try {
      const result = await service.createCheckout(userId, planId);

      request.log.info({
        event: "checkout_created",
        userId,
        planId,
        paymentId: result.paymentId,
      });

      return reply.send(result);
    } catch (error) {
      request.log.error({
        event: "checkout_error",
        error,
      });

      return reply.status(500).send({
        message: "Internal Server Error",
      });
    }
  },
};
