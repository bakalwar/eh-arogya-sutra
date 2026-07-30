# Prescription boundary (Phase 5C)

Phase 5C **must not** issue a prescription.

## Inactive

- Oral mixture generation  
- Potency issuance  
- Electricity issuance  
- Tablet A / Tablet B selection  
- External application selection  
- Final clinical summary as Rx authority  
- Prescription issuance  

## Output contract

```text
PRESCRIPTION_ENGINE_NOT_CONNECTED
```

- `medicine_output_count` = 0  
- `tablet_a` / `tablet_b` / `external_applications` / `oral_mixture` = `null` (not empty success arrays)  
- `default_we_used` = false  
- Production `POST /v1/analyze-complete` remains **501 NOT_CONNECTED**  

Clinical interpretation evidence may inform a **future** Phase 5D prescription reconstruction after owner approval.
