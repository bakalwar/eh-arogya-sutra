# PHASE 1C-B — Report privacy

- Files never leave the browser (`reportUploadConnected() === false`)
- No localStorage persistence of patient inputs or files
- Object URLs revoked on remove / reset / unmount
- No EXIF/location display
- No base64 storage of file contents
- No filename logging of personal data
- PDF uses metadata placeholder only (no embedded execution)
- SVG/HTML uploads not accepted
- Unsaved-work `beforeunload` warning when draft is dirty
- Optional refresh persistence: **not implemented** (in-memory only); documented limitation
