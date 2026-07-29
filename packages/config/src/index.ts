import { z } from 'zod';

export const envSchema = z.object({
  EHAS2_NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  EHAS2_API_PUBLIC_URL: z.string().url().optional(),
  EHAS2_WEB_PUBLIC_URL: z.string().url().optional(),
  EHAS2_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  /** PostgreSQL connection URL — optional; absence → DATABASE_NOT_INSTALLED */
  EHAS2_DATABASE_URL: z.string().min(1).optional(),
  EHAS2_DATABASE_POOL_MIN: z.coerce.number().int().min(0).optional(),
  EHAS2_DATABASE_POOL_MAX: z.coerce.number().int().min(1).optional(),
  EHAS2_DATABASE_SSL_MODE: z.enum(['disable', 'require', 'verify-full']).optional(),
  EHAS2_DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(1).optional(),
});

export type Ehas2Env = z.infer<typeof envSchema>;

export function loadEnv(input: Record<string, string | undefined>): Ehas2Env {
  return envSchema.parse(input);
}
