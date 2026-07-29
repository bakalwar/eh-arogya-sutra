# Container architecture

| Container | Technology | Phase |
|-----------|------------|-------|
| web | Next.js | 1A shell |
| api | Node/Express (health); Python option ADR | 1A shell |
| worker | job runner shell | 1A |
| postgres | application DB | 3 |
| object storage | reports/PDF | 3+ |
