import { FastifyBaseLogger } from "fastify";

export function logInfo(logger: FastifyBaseLogger, data: any) {
  logger.info(data);
}

export function logError(logger: FastifyBaseLogger, data: any) {
  logger.error(data);
}