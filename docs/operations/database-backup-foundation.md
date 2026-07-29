# Database backup foundation

`backup_metadata` records:

- backup status / checksum / verification  
- restore-test status  
- migration step / integrity result  
- owner confirmation  
- traffic-switch status  
- rollback status  

Phase 3A creates metadata only. No working backup/migration execution.
