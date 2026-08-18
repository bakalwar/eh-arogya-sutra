export type TsvWordBlock = {
  text: string;
  confidence: number | null;
  bbox: { x: number; y: number; w: number; h: number };
  blockIndex: number;
};

export function parseTsv(tsv: string, pageWidth: number, pageHeight: number): TsvWordBlock[] {
  const lines = tsv.split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0]?.split('\t') ?? [];
  const col = (name: string): number => header.indexOf(name);
  const levelIdx = col('level');
  const leftIdx = col('left');
  const topIdx = col('top');
  const widthIdx = col('width');
  const heightIdx = col('height');
  const confIdx = col('conf');
  const textIdx = col('text');
  const blockIdx = col('block_num');
  if (
    levelIdx < 0 ||
    leftIdx < 0 ||
    topIdx < 0 ||
    widthIdx < 0 ||
    heightIdx < 0 ||
    textIdx < 0 ||
    blockIdx < 0
  ) {
    return [];
  }
  const safeWidth = pageWidth > 0 ? pageWidth : 1;
  const safeHeight = pageHeight > 0 ? pageHeight : 1;
  const out: TsvWordBlock[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split('\t');
    if (cols[levelIdx] !== '5') continue;
    const text = cols[textIdx]?.trim() ?? '';
    if (!text) continue;
    const left = Number(cols[leftIdx]);
    const top = Number(cols[topIdx]);
    const width = Number(cols[widthIdx]);
    const height = Number(cols[heightIdx]);
    if (![left, top, width, height].every((n) => Number.isFinite(n))) continue;
    const confRaw = confIdx >= 0 ? Number(cols[confIdx]) : NaN;
    const confidence = Number.isFinite(confRaw) ? confRaw : null;
    const blockIndex = Number(cols[blockIdx]);
    out.push({
      text,
      confidence,
      blockIndex: Number.isFinite(blockIndex) ? blockIndex : out.length,
      bbox: {
        x: Math.min(1, Math.max(0, left / safeWidth)),
        y: Math.min(1, Math.max(0, top / safeHeight)),
        w: Math.min(1, Math.max(0.001, width / safeWidth)),
        h: Math.min(1, Math.max(0.001, height / safeHeight)),
      },
    });
  }
  return out;
}
