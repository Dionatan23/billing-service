import dotenv from 'dotenv'

dotenv.config()

export const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN!,
}