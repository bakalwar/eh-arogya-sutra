import { z } from 'zod';

export const envSchema = z.object({
  EHAS2_NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  EHAS2_API_PUBLIC_URL: z.string().url().optional(),
  EHAS2_WEB_PUBLIC_URL: z.string().url().optional(),
  EHAS2_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Ehas2Env = z.infer<typeof envSchema>;

export function loadEnv(input: Record<string, string | undefined>): Ehas2Env {
  return envSchema.parse(input);
}
