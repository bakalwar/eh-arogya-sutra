export type LogFields = Record<string, string | number | boolean | undefined>;

export function logInfo(message: string, fields: LogFields = {}): void {
  const payload = { level: 'info', message, ...fields, ts: new Date().toISOString() };
  console.log(JSON.stringify(payload));
}
