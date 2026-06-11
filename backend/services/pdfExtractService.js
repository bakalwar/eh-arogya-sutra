/**
 * PDF text extraction via pdf-parse (server-side).
 */
async function extractPdfText(buffer) {
  let pdfParse;
  try {
    pdfParse = require('pdf-parse');
  } catch {
    throw new Error('pdf-parse is not installed. Run: npm install pdf-parse');
  }
  const data = await pdfParse(buffer);
  const text = String(data.text || '').trim();
  return {
    text,
    pages: data.numpages || 0,
    info: data.info || {}
  };
}

module.exports = { extractPdfText };
