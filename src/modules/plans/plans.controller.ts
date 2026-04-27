import { FastifyReply, FastifyRequest } from 'fastify'
import { PlansService } from './plans.service'

const service = new PlansService()

export async function getPlans(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const plans = await service.getAll()
  return reply.send(plans)
}