const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const inPath = process.argv[2] || path.join(__dirname, '../uploads/generated_case_summary.md');
const outPath = process.argv[3] || path.join(__dirname, '../uploads/generated_case_summary.pdf');

if (!fs.existsSync(inPath)) {
  console.error('Input markdown not found:', inPath);
  process.exit(1);
}

const md = fs.readFileSync(inPath, 'utf8');

function renderMarkdownToPdf(text, dest) {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const stream = fs.createWriteStream(dest);
  doc.pipe(stream);

  // Simple rendering: headings larger, preserve paragraphs and lists
  const lines = String(text || '').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      doc.moveDown(0.5);
      continue;
    }
    if (line.startsWith('### ')) {
      doc.fontSize(12).fillColor('#2d6a35').text(line.replace(/^###\s+/, ''), { continued: false });
      doc.moveDown(0.2);
      continue;
    }
    if (line.startsWith('## ')) {
      doc.fontSize(14).fillColor('#0e4720').text(line.replace(/^##\s+/, ''), { continued: false });
      doc.moveDown(0.3);
      continue;
    }
    if (line.startsWith('# ')) {
      doc.fontSize(16).fillColor('#0b3a12').text(line.replace(/^#\s+/, ''), { align: 'center' });
      doc.moveDown(0.4);
      continue;
    }
    if (/^\|.*\|$/.test(line)) {
      // table-like line - render monospace
      doc.font('Courier').fontSize(9).fillColor('#000').text(line);
      doc.font('Helvetica');
      continue;
    }
    if (/^\* |\- /.test(line) || /^\d+\./.test(line)) {
      doc.fontSize(10).fillColor('#000').text('• ' + line.replace(/^[\*\-\d\.\s]+/, '').trim(), { indent: 12 });
      continue;
    }
    // normal paragraph
    doc.fontSize(10).fillColor('#000').text(line, { align: 'left' });
  }

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', (e) => reject(e));
  });
}

(async () => {
  try {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    await renderMarkdownToPdf(md, outPath);
    console.log('PDF written to', outPath);
  } catch (e) {
    console.error('PDF generation failed:', e.message || e);
    process.exit(1);
  }
})();

