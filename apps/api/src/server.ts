import { EHAS2_API_NAMESPACE } from '@ehas2/shared';
import { logInfo } from '@ehas2/observability';
import { createApp } from './createApp.js';

/**
 * Production API entry — principal always null until Phase 4 authentication.
 * No header/query identity bypass is wired here.
 */
const app = createApp();
const port = Number(process.env.EHAS2_API_PORT ?? 4100);

if (process.env.EHAS2_API_LISTEN !== '0') {
  app.listen(port, () => {
    logInfo('EHAS2 API listening', { port, namespace: EHAS2_API_NAMESPACE });
  });
}

export { app, createApp };
