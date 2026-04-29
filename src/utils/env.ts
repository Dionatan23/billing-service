import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  MP_ACCESS_TOKEN: z.string(),
  API_URL: z.string(),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid env:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;