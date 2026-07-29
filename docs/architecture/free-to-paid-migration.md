# Free-to-paid migration

Controlled workflow (not an unsafe instant copy):

1. Preflight → 2. Target provisioning → 3. Config validation → 4. Schema migration → 5. Encrypted source backup → 6. Restore/copy → 7. Record-count comparison → 8. Checksum/integrity → 9. Permission verification → 10. Read-only smoke tests → 11. Health checks → 12. Temp upload emptiness → 13. Maintenance window → 14. Incremental sync → 15. Owner confirmation → 16. Traffic switch → 17. Monitoring → 18. Rollback window → 19. Source retirement

Future Super Admin Migration Control is **contract only**. Gates require verified backup, integrity validation, owner confirmation, rollback plan, and Super Admin identity.
