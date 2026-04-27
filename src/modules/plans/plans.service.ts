import { prisma } from "../../infra/database/client";


export class PlansService {
  async getAll() {
    return prisma.plan.findMany()
  }
}