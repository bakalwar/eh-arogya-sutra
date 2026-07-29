export const EHAS2_STORAGE_PREFIX = 'ehas2:' as const;
export const EHAS2_API_NAMESPACE = '/api/eh-as-2/v1' as const;

/** Shared foundation status codes for incomplete subsystems. */
export const FoundationStatus = {
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  NOT_CONNECTED: 'NOT_CONNECTED',
  NOT_READY: 'NOT_READY',
  DATA_PACKAGE_NOT_INSTALLED: 'DATA_PACKAGE_NOT_INSTALLED',
} as const;

export type FoundationStatusCode = (typeof FoundationStatus)[keyof typeof FoundationStatus];

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
