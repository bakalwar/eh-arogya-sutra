#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const { buildClinicalSummaryForCase } = require('../services/expertClinicalSummaryService');

async function run() {
  const arg = process.argv[2];
  if (!arg) {
    console.log('Usage: node scripts/generate_case_summary.js <case.json>');
    console.log('\nExample case JSON template (save as case.json and pass its path):\n');
    console.log(JSON.stringify({
      patient: {
        age: 45,
        gender: 'Male',
        weight: 70,
        bp_systolic: 130,
        bp_diastolic: 80,
        pulse: 78,
        chiefComplaint: 'खांसी और जोड़ों में दर्द',
        symptoms: [{ name: 'khansi' }, { name: 'dard' }, { name: 'uric' }]
      },
      analysis: {
        phase: 'ACUTE',
        temperament: '',
        chief_complaint: 'खांसी, बुखार',
        report_values: {
          hemoglobin: 13,
          uric_acid: 8.2,
          creatinine: 1.0,
          sugar_fast: 110,
          tsh: 2.5,
          sgpt: 30,
          cholesterol: 180,
          pth: 40
        },
        affected_organs: ['kidney', 'skin']
      }
    }, null, 2));
    process.exit(0);
  }

  const p = path.resolve(process.cwd(), arg);
  if (!fs.existsSync(p)) {
    console.error('File not found:', p);
    process.exit(1);
  }

  let caseData;
  try {
    caseData = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error('Invalid JSON:', e.message);
    process.exit(1);
  }

  try {
    console.log('Generating dynamic clinical summary for case...', p);
    const out = await buildClinicalSummaryForCase(caseData);
    const md = out.summary || out;
    const outPath = path.join(__dirname, '../uploads/generated_case_summary.md');
    fs.writeFileSync(outPath, md, 'utf8');
    const wc = String(md || '').split(/\s+/).filter(Boolean).length;
    console.log(`Summary saved: ${outPath} (words: ${wc})`);
    console.log('\n--- Summary Preview ---\n');
    console.log((md || '').slice(0, 1600));
  } catch (err) {
    console.error('Summary generation failed:', err.message || err);
    process.exit(1);
  }
}

run();

