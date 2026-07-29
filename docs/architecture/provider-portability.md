# Provider portability

Application code must not depend on one cloud provider.

Abstractions contracts:

- DatabaseProvider
- TemporaryObjectStore
- QueueProvider
- EmailProvider
- SmsProvider
- MonitoringProvider
- SecretProvider
- BackupProvider
- DeploymentProvider

No provider SDKs or credentials in Phase 2A-D. PostgreSQL-compatible persistence is planned for Phase 3.
