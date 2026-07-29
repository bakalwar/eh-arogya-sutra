# PHASE 2A-M — Permission matrix

| Permission | Doctor | ClinicAdmin | ManagementAdmin | DoctorVerificationAdmin | BillingAdmin | SupportAdmin | FinanceViewer | PlatformOperationsManager | ManagementReadOnlyAuditor | SuperAdmin |
|------------|:------:|:-----------:|:---------------:|:-----------------------:|:------------:|:------------:|:-------------:|:-------------------------:|:-------------------------:|:----------:|
| feedback.submit | Y | Y | | | | | | | | |
| management.shell.access | | | Y | Y | Y | Y | Y | Y | Y | |
| doctor:list | | | Y | Y | | | | Y | Y | |
| doctor:verification_review | | | Y | Y | | | | | | |
| doctor:status_manage | | | Y | Y | | | | | | |
| subscription:manage | | | Y | | Y | | | | | |
| payment:view | | | Y | | Y | | Y | | Y | |
| refund:request | | | Y | | Y | | | | | |
| refund:approve | | | Y | | | | | | | |
| support_ticket:* | | | Y | | | Y | | | list/view | |
| feedback:moderate | | | Y | | | Y | | | | |
| referral:manage | | | Y | | | | | Y | | |
| management_report:view | | | Y | | | | Y | Y | Y | |
| usage_analytics:view_safe | | | Y | | | | | Y | Y | |
| management.audit.view | | | Y | | | | | Y | Y | |
| ops.super_admin.control_plane | | | | | | | | | | Y |
| patient.read (default) | Y | Y | | | | | | | | |
| ops.security.read | | | | | | | | | | Y* |

\* SecurityAnalyst also has ops.security.read; SupportAdmin does **not**.

Clinic Admin has clinic.config.write only within clinic scope — never platform Management shell.
