# PHASE 3A MIGRATION TESTS

Covered in `tests/integration/phase3a-persistence.test.ts`:

1. Clean migration from empty schema  
2. Schema version recorded (`3A.0.0`)  
3. Foreign keys present  
4. Required indexes present  
5. Migration checksum tracked  
6. Duplicate migration skipped safely  
7. Rollback of last migration (006 RLS) then re-apply  
