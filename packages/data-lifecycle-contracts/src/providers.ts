import { FoundationStatus } from '@ehas2/shared';

/**
 * Provider-independent deployment abstractions — no credentials, no SDKs in Phase 2A-D.
 */
export type DatabaseProvider = {
  id: 'DatabaseProvider';
  status: typeof FoundationStatus.NOT_IMPLEMENTED;
  supportsMigrations: true;
  sqliteAsProductionForbidden: true;
};

export type TemporaryObjectStore = {
  id: 'TemporaryObjectStore';
  status: typeof FoundationStatus.NOT_IMPLEMENTED;
  publicUrlsForbidden: true;
  permanentRetentionForbidden: true;
};

export type QueueProvider = {
  id: 'QueueProvider';
  status: typeof FoundationStatus.NOT_IMPLEMENTED;
};

export type EmailProvider = {
  id: 'EmailProvider';
  status: typeof FoundationStatus.NOT_IMPLEMENTED;
};

export type SmsProvider = {
  id: 'SmsProvider';
  status: typeof FoundationStatus.NOT_IMPLEMENTED;
};

export type MonitoringProvider = {
  id: 'MonitoringProvider';
  status: typeof FoundationStatus.NOT_IMPLEMENTED;
};

export type SecretProvider = {
  id: 'SecretProvider';
  status: typeof FoundationStatus.NOT_IMPLEMENTED;
  credentialsInSourceForbidden: true;
};

export type BackupProvider = {
  id: 'BackupProvider';
  status: typeof FoundationStatus.NOT_IMPLEMENTED;
  temporaryReportsExcluded: true;
  clinicalTextIncluded: true;
};

export type DeploymentProvider = {
  id: 'DeploymentProvider';
  status: typeof FoundationStatus.NOT_IMPLEMENTED;
};

export type ProviderAbstractionCatalog = {
  database: DatabaseProvider;
  temporaryObjectStore: TemporaryObjectStore;
  queue: QueueProvider;
  email: EmailProvider;
  sms: SmsProvider;
  monitoring: MonitoringProvider;
  secret: SecretProvider;
  backup: BackupProvider;
  deployment: DeploymentProvider;
};

export function createNotImplementedProviderCatalog(): ProviderAbstractionCatalog {
  const status = FoundationStatus.NOT_IMPLEMENTED;
  return {
    database: {
      id: 'DatabaseProvider',
      status,
      supportsMigrations: true,
      sqliteAsProductionForbidden: true,
    },
    temporaryObjectStore: {
      id: 'TemporaryObjectStore',
      status,
      publicUrlsForbidden: true,
      permanentRetentionForbidden: true,
    },
    queue: { id: 'QueueProvider', status },
    email: { id: 'EmailProvider', status },
    sms: { id: 'SmsProvider', status },
    monitoring: { id: 'MonitoringProvider', status },
    secret: {
      id: 'SecretProvider',
      status,
      credentialsInSourceForbidden: true,
    },
    backup: {
      id: 'BackupProvider',
      status,
      temporaryReportsExcluded: true,
      clinicalTextIncluded: true,
    },
    deployment: { id: 'DeploymentProvider', status },
  };
}

export function assertNoProviderCredentialsInCatalog(catalog: ProviderAbstractionCatalog): boolean {
  const serialized = JSON.stringify(catalog);
  // Avoid false positives on type names like SecretProvider / credentialsInSourceForbidden.
  return !/(?:api[_-]?key|access[_-]?token|password)\s*[:=]|AKIA[0-9A-Z]{16}|-----BEGIN |["']sk[_-]live/i.test(
    serialized,
  );
}
