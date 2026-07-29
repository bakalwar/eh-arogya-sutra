# Database security

- Validated env: `EHAS2_DATABASE_URL`, pool min/max, SSL mode, statement timeout  
- Production fails closed when SSL mode is `disable`  
- Parameterized queries only  
- Safe errors hide connection details  
- No hosted-provider-specific SDK  
- No production SQLite  
- Audit events forbid OTP/token/report-bytes/base64/image/pdf/secret metadata keys  
- Ordinary Admin cannot delete audit history (enforced in later service layers; schema has no delete API)
