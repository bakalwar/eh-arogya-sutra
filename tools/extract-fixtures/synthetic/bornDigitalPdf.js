/**
 * Minimal born-digital PDF byte generators (no external fixture files).
 * Produces valid PDF 1.4 with embedded Type1 Helvetica text operators.
 */

function buildPdf(textLines) {
  const objects = [];
  let nextId = 1;
  const alloc = () => nextId++;

  const catalogId = alloc();
  const pagesId = alloc();
  const pageId = alloc();
  const contentsId = alloc();
  const fontId = alloc();

  const textOps = textLines
    .map((line, i) => {
      const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
      const y = 700 - i * 16;
      return `BT /F1 12 Tf 72 ${y} Td (${escaped}) Tj ET`;
    })
    .join('\n');
  const streamBody = `${textOps}\n`;
  const streamLen = Buffer.byteLength(streamBody, 'latin1');

  objects[catalogId] = `${catalogId} 0 obj<</Type/Catalog/Pages ${pagesId} 0 R>>endobj`;
  objects[pagesId] = `${pagesId} 0 obj<</Type/Pages/Kids[${pageId} 0 R]/Count 1>>endobj`;
  objects[pageId] =
    `${pageId} 0 obj<</Type/Page/MediaBox[0 0 612 792]/Contents ${contentsId} 0 R/Resources<</Font<</F1 ${fontId} 0 R>>>>>>endobj`;
  objects[contentsId] =
    `${contentsId} 0 obj<</Length ${streamLen}>>stream\n${streamBody}endstream\nendobj`;
  objects[fontId] = `${fontId} 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj`;

  const header = '%PDF-1.4\n';
  let body = '';
  const offsets = [0];
  for (let id = 1; id < nextId; id++) {
    offsets[id] = Buffer.byteLength(header + body, 'latin1');
    body += `${objects[id]}\n`;
  }
  const xrefOffset = Buffer.byteLength(header + body, 'latin1');
  let xref = `xref\n0 ${nextId}\n0000000000 65535 f \n`;
  for (let id = 1; id < nextId; id++) {
    xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer<</Size ${nextId}/Root ${catalogId} 0 R>>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(header + body + xref + trailer, 'latin1');
}

/** Born-digital English lab-style report page. */
export function bornDigitalEnglishPdf() {
  return new Uint8Array(
    buildPdf([
      'Laboratory Report',
      'Patient: Synthetic Test',
      'Hemoglobin 13.2 g/dL',
      'Reference Range 12.0 - 16.0 g/dL',
      'WBC Count 7200 /uL',
    ]),
  );
}

/** Born-digital Hindi (Devanagari) lab-style report page. */
export function bornDigitalHindiPdf() {
  return new Uint8Array(
    buildPdf([
      'प्रयोगशाला रिपोर्ट',
      'रोगी: परीक्षण',
      'हीमोग्लोबिन 13.2 g/dL',
      'संदर्भ सीमा 12.0 - 16.0 g/dL',
    ]),
  );
}

/** Minimal single-line PDF for sufficiency tests. */
export function minimalEnglishPdf(line = 'Hemoglobin test result') {
  return new Uint8Array(buildPdf([line]));
}
