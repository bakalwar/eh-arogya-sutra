/** PDF diagram coordinates (match frontend viewBox 240×480) */
const ANATOMY_SVG_ZONES = {
  brain: { cx: 120, cy: 42 },
  eyes: { cx: 120, cy: 58 },
  throat: { cx: 120, cy: 88 },
  lungs: { cx: 120, cy: 145 },
  heart: { cx: 108, cy: 138 },
  trachea: { cx: 120, cy: 118 },
  stomach: { cx: 120, cy: 218 },
  liver: { cx: 148, cy: 205 },
  kidneys: { cx: 120, cy: 248 },
  spleen: { cx: 92, cy: 210 },
  intestines: { cx: 120, cy: 278 },
  bladder: { cx: 120, cy: 318 },
  cervical: { cx: 120, cy: 100 },
  thoracic: { cx: 120, cy: 168 },
  lumbar: { cx: 120, cy: 248 },
  shoulders: { cx: 120, cy: 112 },
  arms: { cx: 48, cy: 200 },
  hands: { cx: 42, cy: 295 },
  legs: { cx: 120, cy: 390 },
  neck_nodes: { cx: 120, cy: 98 },
  armpits: { cx: 88, cy: 155 },
  groin: { cx: 120, cy: 342 }
};

const SEVERITY_R = { mild: 4, moderate: 6, severe: 8 };

function drawAnatomyDiagram(doc, anatomy, x, y, boxW, boxH) {
  const markings = anatomy?.markings || {};
  const scaleX = boxW / 240;
  const scaleY = boxH / 480;
  const ox = x;
  const oy = y;

  doc.save();
  doc.rect(ox, oy, boxW, boxH).strokeColor('#2d6a35').lineWidth(0.5).stroke();

  const sx = (v) => ox + v * scaleX;
  const sy = (v) => oy + v * scaleY;

  doc.strokeColor('#4a9b54').lineWidth(0.8);
  doc.ellipse(sx(120), sy(42), 32 * scaleX, 30 * scaleY);
  doc.moveTo(sx(88), sy(72)).lineTo(sx(152), sy(72)).lineTo(sx(148), sy(108)).lineTo(sx(92), sy(108)).closePath().stroke();
  doc.moveTo(sx(70), sy(115)).lineTo(sx(170), sy(115)).lineTo(sx(175), sy(195)).lineTo(sx(65), sy(195)).closePath().stroke();
  doc.moveTo(sx(82), sy(205)).lineTo(sx(158), sy(205)).lineTo(sx(162), sy(320)).lineTo(sx(78), sy(320)).closePath().stroke();
  doc.moveTo(sx(70), sy(120)).lineTo(sx(42), sy(200)).lineTo(sx(38), sy(300)).stroke();
  doc.moveTo(sx(170), sy(120)).lineTo(sx(198), sy(200)).lineTo(sx(202), sy(300)).stroke();
  doc.moveTo(sx(95), sy(330)).lineTo(sx(88), sy(420)).stroke();
  doc.moveTo(sx(145), sy(330)).lineTo(sx(152), sy(420)).stroke();

  for (const [partId, mark] of Object.entries(markings)) {
    const z = ANATOMY_SVG_ZONES[partId];
    if (!z || !mark) continue;
    const isNeg = mark.polarity === 'negative';
    doc.circle(sx(z.cx), sy(z.cy), SEVERITY_R[mark.severity] || 5).fill(isNeg ? '#2980b9' : '#c0392b');
  }

  doc.restore();
}

module.exports = { drawAnatomyDiagram, ANATOMY_SVG_ZONES };
