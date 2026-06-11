/** Clickable anatomy regions — EH medicine series mapping */
export const ANATOMY_GROUPS = [
  { id: 'head', label: 'Head', labelHi: 'शिर' },
  { id: 'chest', label: 'Chest', labelHi: 'वक्ष' },
  { id: 'abdomen', label: 'Abdomen', labelHi: 'उदर' },
  { id: 'spine', label: 'Spine', labelHi: 'रीढ़' },
  { id: 'limbs', label: 'Limbs', labelHi: 'अंग' },
  { id: 'lymph', label: 'Lymph', labelHi: 'लसीका' }
];

export const ANATOMY_PARTS = [
  { id: 'brain', label: 'Brain', group: 'head', system: 'neurological', series: ['C'] },
  { id: 'eyes', label: 'Eyes', group: 'head', system: 'neurological', series: ['C', 'P'] },
  { id: 'throat', label: 'Throat', group: 'head', system: 'respiratory', series: ['P', 'S'] },
  { id: 'lungs', label: 'Lungs', group: 'chest', system: 'respiratory', series: ['P'] },
  { id: 'heart', label: 'Heart', group: 'chest', system: 'cardiovascular', series: ['A'] },
  { id: 'trachea', label: 'Trachea', group: 'chest', system: 'respiratory', series: ['P'] },
  { id: 'stomach', label: 'Stomach', group: 'abdomen', system: 'abdominal', series: ['S', 'C'] },
  { id: 'liver', label: 'Liver', group: 'abdomen', system: 'lymphatic', series: ['S'] },
  { id: 'kidneys', label: 'Kidneys', group: 'abdomen', system: 'renal', series: ['S', 'C'] },
  { id: 'spleen', label: 'Spleen', group: 'abdomen', system: 'lymphatic', series: ['S'] },
  { id: 'intestines', label: 'Intestines', group: 'abdomen', system: 'abdominal', series: ['S', 'C'] },
  { id: 'bladder', label: 'Bladder', group: 'abdomen', system: 'urinary', series: ['S', 'C'] },
  { id: 'cervical', label: 'Cervical spine', group: 'spine', system: 'musculoskeletal', series: ['C', 'F'] },
  { id: 'thoracic', label: 'Thoracic spine', group: 'spine', system: 'musculoskeletal', series: ['C', 'F'] },
  { id: 'lumbar', label: 'Lumbar spine', group: 'spine', system: 'musculoskeletal', series: ['C', 'F'] },
  { id: 'shoulders', label: 'Shoulders', group: 'limbs', system: 'musculoskeletal', series: ['C', 'F'] },
  { id: 'arms', label: 'Arms', group: 'limbs', system: 'musculoskeletal', series: ['C', 'F'] },
  { id: 'hands', label: 'Hands', group: 'limbs', system: 'musculoskeletal', series: ['C', 'F'] },
  { id: 'legs', label: 'Legs', group: 'limbs', system: 'musculoskeletal', series: ['C', 'F'] },
  { id: 'neck_nodes', label: 'Neck nodes', group: 'lymph', system: 'lymphatic', series: ['S'] },
  { id: 'armpits', label: 'Armpits', group: 'lymph', system: 'lymphatic', series: ['S'] },
  { id: 'groin', label: 'Groin nodes', group: 'lymph', system: 'lymphatic', series: ['S'] }
];

/** SVG hit zones (viewBox 0 0 240 480) */
export const ANATOMY_SVG_ZONES = {
  brain: { cx: 120, cy: 42, rx: 28, ry: 24 },
  eyes: { cx: 120, cy: 58, rx: 34, ry: 10 },
  throat: { cx: 120, cy: 88, rx: 14, ry: 12 },
  lungs: { cx: 120, cy: 145, rx: 52, ry: 38 },
  heart: { cx: 108, cy: 138, rx: 16, ry: 18 },
  trachea: { cx: 120, cy: 118, rx: 8, ry: 22 },
  stomach: { cx: 120, cy: 218, rx: 32, ry: 28 },
  liver: { cx: 148, cy: 205, rx: 22, ry: 26 },
  kidneys: { cx: 120, cy: 248, rx: 38, ry: 16 },
  spleen: { cx: 92, cy: 210, rx: 14, ry: 20 },
  intestines: { cx: 120, cy: 278, rx: 36, ry: 32 },
  bladder: { cx: 120, cy: 318, rx: 20, ry: 16 },
  cervical: { cx: 120, cy: 100, rx: 10, ry: 18 },
  thoracic: { cx: 120, cy: 168, rx: 10, ry: 42 },
  lumbar: { cx: 120, cy: 248, rx: 10, ry: 36 },
  shoulders: { cx: 120, cy: 112, rx: 68, ry: 18 },
  arms: { cx: 48, cy: 200, rx: 18, ry: 70 },
  hands: { cx: 42, cy: 295, rx: 16, ry: 14 },
  legs: { cx: 120, cy: 390, rx: 44, ry: 95 },
  neck_nodes: { cx: 120, cy: 98, rx: 22, ry: 10 },
  armpits: { cx: 88, cy: 155, rx: 14, ry: 12 },
  groin: { cx: 120, cy: 342, rx: 28, ry: 14 }
};

export const SYSTEM_LABELS = {
  respiratory: 'Respiratory',
  cardiovascular: 'Cardiovascular',
  lymphatic: 'Lymphatic',
  neurological: 'Neurological',
  abdominal: 'Abdominal',
  renal: 'Renal',
  urinary: 'Urinary',
  musculoskeletal: 'Musculoskeletal'
};

export const SERIES_NAMES = {
  P: 'Pettorale (P)',
  S: 'Scrofoloso (S)',
  A: 'Angiotico (A)',
  C: 'Canceroso (C)',
  F: 'Febrifugo (F)'
};

export function partById(id) {
  return ANATOMY_PARTS.find((p) => p.id === id);
}
