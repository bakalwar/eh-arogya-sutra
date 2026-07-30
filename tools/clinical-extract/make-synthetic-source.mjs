import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = path.join(root, 'fixtures/synthetic/clinical');
fs.mkdirSync(dir, { recursive: true });
const p = path.join(dir, 'synthetic-source.sqlite');
if (fs.existsSync(p)) fs.unlinkSync(p);

const db = new Database(p);
db.exec(`
CREATE TABLE diseases (
  id INTEGER PRIMARY KEY,
  icd10_code TEXT,
  name_english TEXT UNIQUE,
  category TEXT,
  system_key TEXT,
  symptoms_en TEXT,
  base_medicines TEXT,
  prakruti TEXT,
  name_hindi TEXT,
  symptoms_hi TEXT,
  base_formula TEXT
);
CREATE TABLE consultations (
  id INTEGER PRIMARY KEY,
  patient_name TEXT,
  phone TEXT,
  formula_json TEXT
);
INSERT INTO diseases VALUES (1,'A00','Demo Disease Alpha','demo','METABOLIC','fever','A1','Mixed','रोग अ','बुखार','');
INSERT INTO diseases VALUES (2,'A01','Demo Disease Beta','demo','JOINTS','pain','S1','Mixed','रोग ब','दर्द','');
INSERT INTO diseases VALUES (3,'A02','Demo Disease Gamma','demo','LIVER','nausea','C1','Mixed','रोग ग','मतली','');
INSERT INTO consultations VALUES (1,'SHOULD_NOT_EXTRACT','9999999999','{"bad":true}');
`);
db.close();
console.log(`SYNTH_DB=${p}`);
