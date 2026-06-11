const os = require('os');
const path = require('path');
const pdfParse = require('pdf-parse');
const fs = require('fs');

async function test() {
  const defaultPath = path.join(os.homedir(), 'Downloads', 'E.H.AROGYA SUTRA BOOK', 'Adobe Scan 11 Apr 2026 (1).pdf');
  const buf = fs.readFileSync(process.env.TEST_PDF_PATH || defaultPath);
  const result = await pdfParse(buf);
  console.log('Pages:', result.numpages);
  console.log('Text length:', result.text.length);
  console.log('Sample:', JSON.stringify(result.text.slice(0, 500)));
}
test().catch(e => console.error('Error:', e.message));
