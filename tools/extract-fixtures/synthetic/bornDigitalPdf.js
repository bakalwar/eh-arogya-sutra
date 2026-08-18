/**
 * Synthetic written-report PDF fixtures (no real patient data).
 * Born-digital pages use PDF text operators. Hindi uses marked ActualText
 * plus a Type3 ToUnicode mapping so extraction is Unicode without a proprietary font.
 * Scanned pages are image-only (no text layer) for Tesseract fallback tests.
 */
import { deflateSync } from 'node:zlib';

function pdfActualTextHex(unicode) {
  let hex = 'FEFF';
  for (const ch of unicode) {
    hex += ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
  }
  return hex;
}

function escapePdfString(line) {
  return line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function textContentStream(textLines, useActualText) {
  return textLines
    .map((line, i) => {
      const y = 700 - i * 18;
      const asciiPlaceholder = line.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ');
      const escaped = escapePdfString(asciiPlaceholder);
      if (!useActualText) {
        return `BT /F1 12 Tf 72 ${y} Td (${escaped}) Tj ET`;
      }
      const hex = pdfActualTextHex(line);
      return `BT /F1 12 Tf 72 ${y} Td /Span << /ActualText <${hex}> >> BDC (${escaped}) Tj EMC ET`;
    })
    .join('\n');
}

function assemblePdf(objectBodies) {
  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  let body = '';
  const offsets = [0];
  for (let id = 1; id <= objectBodies.length; id++) {
    offsets[id] = Buffer.byteLength(header + body, 'latin1');
    body += `${id} 0 obj\n${objectBodies[id - 1]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(header + body, 'latin1');
  let xref = `xref\n0 ${objectBodies.length + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= objectBodies.length; id++) {
    xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer<</Size ${objectBodies.length + 1}/Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(header + body + xref + trailer, 'latin1');
}

function buildTextPdf(pages, { useActualText = false } = {}) {
  const kids = [];
  const objects = [];
  objects.push(null);
  objects.push(null);
  const catalogId = 1;
  const pagesId = 2;
  const fontId = 3;
  objects[fontId] = `<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>`;

  let nextId = 4;
  const pageIds = [];
  for (const lines of pages) {
    const pageId = nextId++;
    const contentsId = nextId++;
    pageIds.push(pageId);
    const streamBody = `${textContentStream(lines, useActualText)}\n`;
    const streamLen = Buffer.byteLength(streamBody, 'latin1');
    objects[pageId] =
      `<</Type/Page/Parent ${pagesId} 0 R/MediaBox[0 0 612 792]/Contents ${contentsId} 0 R/Resources<</Font<</F1 ${fontId} 0 R>>>>>>`;
    objects[contentsId] = `<</Length ${streamLen}>>stream\n${streamBody}endstream`;
    kids.push(`${pageId} 0 R`);
  }

  objects[catalogId] = `<</Type/Catalog/Pages ${pagesId} 0 R>>`;
  objects[pagesId] = `<</Type/Pages/Kids[${kids.join(' ')}]/Count ${pageIds.length}>>`;

  const ordered = [];
  for (let id = 1; id < nextId; id++) ordered.push(objects[id]);
  return new Uint8Array(assemblePdf(ordered));
}

function buildImagePagePdf(rgbPages) {
  const objects = [];
  objects[1] = null;
  objects[2] = null;
  const catalogId = 1;
  const pagesId = 2;
  let nextId = 3;
  const kids = [];

  for (const page of rgbPages) {
    const imageId = nextId++;
    const contentsId = nextId++;
    const pageId = nextId++;
    const compressed = deflateSync(Buffer.from(page.rgb));
    objects[imageId] =
      `<</Type/XObject/Subtype/Image/Width ${page.width}/Height ${page.height}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/FlateDecode/Length ${compressed.length}>>stream\n` +
      compressed.toString('latin1') +
      '\nendstream';
    const content = `q ${page.width} 0 0 ${page.height} 0 0 cm /Im1 Do Q\n`;
    objects[contentsId] =
      `<</Length ${Buffer.byteLength(content, 'latin1')}>>stream\n${content}endstream`;
    objects[pageId] =
      `<</Type/Page/Parent ${pagesId} 0 R/MediaBox[0 0 ${page.width} ${page.height}]/Contents ${contentsId} 0 R/Resources<</XObject<</Im1 ${imageId} 0 R>>>>>>`;
    kids.push(`${pageId} 0 R`);
  }

  objects[catalogId] = `<</Type/Catalog/Pages ${pagesId} 0 R>>`;
  objects[pagesId] = `<</Type/Pages/Kids[${kids.join(' ')}]/Count ${rgbPages.length}>>`;
  const ordered = [];
  for (let id = 1; id < nextId; id++) ordered.push(objects[id]);
  return new Uint8Array(assemblePdf(ordered));
}

function mixRgb(width, height, paint) {
  const rgb = Buffer.alloc(width * height * 3, 255);
  paint(rgb, width, height);
  return { width, height, rgb };
}

function drawTextApprox(rgb, width, height, text, originX, originY) {
  let x = originX;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    for (let dy = 0; dy < 10; dy++) {
      for (let dx = 0; dx < 6; dx++) {
        const on = (code + dx + dy) % 5 !== 0;
        if (!on) continue;
        const px = x + dx;
        const py = originY + dy;
        if (px < 0 || py < 0 || px >= width || py >= height) continue;
        const idx = (py * width + px) * 3;
        rgb[idx] = 0;
        rgb[idx + 1] = 0;
        rgb[idx + 2] = 0;
      }
    }
    x += 7;
  }
}

export function bornDigitalEnglishPdf() {
  return buildTextPdf([
    [
      'Laboratory Report',
      'Patient: Synthetic Test',
      'Hemoglobin 13.2 g/dL',
      'Reference Range 12.0 - 16.0 g/dL',
      'WBC Count 7200 /uL',
    ],
  ]);
}

export function bornDigitalHindiPdf() {
  return buildTextPdf(
    [
      [
        'Laboratory Report Synthetic Hindi Written Page',
        'Patient: Synthetic Test',
        'हीमोग्लोबिन 13.2 g/dL',
        'संदर्भ सीमा 12.0 - 16.0 g/dL',
        'WBC Count 7200 /uL',
      ],
    ],
    { useActualText: true },
  );
}

export function bornDigitalMixedPdf() {
  return buildTextPdf(
    [
      [
        'Laboratory Report / प्रयोगशाला रिपोर्ट',
        'Hemoglobin / हीमोग्लोबिन 13.2 g/dL',
        'Reference Range 12.0 - 16.0 g/dL',
        'WBC Count 7200 /uL',
      ],
    ],
    { useActualText: true },
  );
}

export function multiPageProvenancePdf() {
  return buildTextPdf([
    [
      'Laboratory Report page 1 of 2',
      'Patient: Synthetic Test',
      'Hemoglobin 13.2 g/dL',
      'Reference Range 12.0 - 16.0 g/dL',
      'WBC Count 7200 /uL',
    ],
    [
      'Laboratory Report page 2 of 2',
      'Platelet Count 250000 /uL',
      'Reference Range 150000 - 450000 /uL',
      'Comment: synthetic written values only',
    ],
  ]);
}

export function mixedTextAndScannedPdf() {
  return buildTextPdf([
    [
      'Laboratory Report digital page',
      'Patient: Synthetic Test',
      'Hemoglobin 13.2 g/dL',
      'Reference Range 12.0 - 16.0 g/dL',
      'WBC Count 7200 /uL',
    ],
    [' '],
  ]);
}

export async function renderCanvasRgb(width, height, draw) {
  const canvasMod = await import('@napi-rs/canvas');
  const canvas = canvasMod.createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000000';
  await draw(ctx, canvasMod);
  const imageData = ctx.getImageData(0, 0, width, height);
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0, p = 0; i < imageData.data.length; i += 4, p += 3) {
    rgb[p] = imageData.data[i];
    rgb[p + 1] = imageData.data[i + 1];
    rgb[p + 2] = imageData.data[i + 2];
  }
  return { width, height, rgb };
}

function tryRegisterDevanagari(GlobalFonts) {
  const candidates = [
    '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf',
    '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
  ];
  for (const file of candidates) {
    try {
      GlobalFonts.registerFromPath(file, 'NotoSansDevanagari');
      return 'NotoSansDevanagari';
    } catch {
      /* next */
    }
  }
  return 'sans-serif';
}

export async function scannedEnglishReportPdf() {
  const page = await renderCanvasRgb(800, 360, (ctx) => {
    ctx.font = '28px sans-serif';
    ctx.fillText('Laboratory Report', 40, 60);
    ctx.fillText('Hemoglobin 13.2 g/dL', 40, 110);
    ctx.fillText('Reference Range 12.0 - 16.0 g/dL', 40, 160);
    ctx.fillText('WBC Count 7200 /uL', 40, 210);
  });
  return buildImagePagePdf([page]);
}

export async function scannedHindiReportPdf() {
  const page = await renderCanvasRgb(800, 360, (ctx, canvasMod) => {
    const family = tryRegisterDevanagari(canvasMod.GlobalFonts);
    ctx.font = `28px ${family}, sans-serif`;
    ctx.fillText('प्रयोगशाला रिपोर्ट', 40, 60);
    ctx.fillText('हीमोग्लोबिन 13.2 g/dL', 40, 110);
    ctx.fillText('संदर्भ सीमा 12.0 - 16.0 g/dL', 40, 160);
  });
  return buildImagePagePdf([page]);
}

export async function scannedMixedReportPdf() {
  const page = await renderCanvasRgb(800, 360, (ctx, canvasMod) => {
    const family = tryRegisterDevanagari(canvasMod.GlobalFonts);
    ctx.font = `26px ${family}, sans-serif`;
    ctx.fillText('Hemoglobin / हीमोग्लोबिन 13.2 g/dL', 40, 80);
    ctx.fillText('Reference Range 12.0 - 16.0 g/dL', 40, 140);
  });
  return buildImagePagePdf([page]);
}

export async function scannedMultiPagePdf() {
  const page1 = await renderCanvasRgb(800, 280, (ctx) => {
    ctx.font = '26px sans-serif';
    ctx.fillText('Scanned page 1 Hemoglobin 13.2 g/dL', 40, 80);
  });
  const page2 = await renderCanvasRgb(800, 280, (ctx) => {
    ctx.font = '26px sans-serif';
    ctx.fillText('Scanned page 2 Glucose 92 mg/dL', 40, 80);
  });
  return buildImagePagePdf([page1, page2]);
}

export function blankLowQualityPdf() {
  return buildImagePagePdf([mixRgb(64, 64, () => undefined)]);
}

export function passwordProtectedPdf() {
  const objects = [
    `<</Type/Catalog/Pages 2 0 R>>`,
    `<</Type/Pages/Kids[3 0 R]/Count 1>>`,
    `<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>`,
    `<</Length 0>>stream\nendstream`,
    `<</Filter/Standard/V 1/R 2/O(xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)/U(xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)/P -4>>`,
  ];
  const header = '%PDF-1.4\n';
  let body = '';
  const offsets = [0];
  for (let id = 1; id <= objects.length; id++) {
    offsets[id] = Buffer.byteLength(header + body, 'latin1');
    body += `${id} 0 obj\n${objects[id - 1]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(header + body, 'latin1');
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= objects.length; id++) {
    xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer<</Size ${objects.length + 1}/Root 1 0 R/Encrypt 5 0 R/ID[<11111111111111111111111111111111><11111111111111111111111111111111>]>>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(header + body + xref + trailer, 'latin1'));
}

export function malformedPdf() {
  return new Uint8Array(Buffer.from('%PDF-1.4\nnot a real document', 'latin1'));
}

export function oversizedPageCountPdf() {
  const lines = [];
  for (let i = 1; i <= 21; i++) {
    lines.push([
      `Laboratory Report page ${i}`,
      'Patient: Synthetic Test',
      'Hemoglobin 13.2 g/dL',
      'Reference Range 12.0 - 16.0 g/dL',
      'WBC Count 7200 /uL',
    ]);
  }
  return buildTextPdf(lines);
}

export function minimalEnglishPdf(line = 'Hemoglobin test result') {
  return buildTextPdf([[line]]);
}
