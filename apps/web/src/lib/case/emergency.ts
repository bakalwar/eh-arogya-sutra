export type RedFlagOption = {
  id: string;
  label: string;
};

export const RED_FLAG_OPTIONS: readonly RedFlagOption[] = [
  { id: 'chest-pain', label: 'Severe chest pain' },
  { id: 'breathing', label: 'Breathing difficulty' },
  { id: 'consciousness', label: 'Loss of consciousness' },
  { id: 'stroke-like', label: 'Stroke-like symptoms' },
  { id: 'bleeding', label: 'Severe bleeding' },
  { id: 'very-high-bp', label: 'Very high BP entered by doctor' },
] as const;

export const EMERGENCY_WARNING_COPY =
  'Selected red-flag answers suggest urgent clinical or emergency assessment may be needed. This is a UI warning only — not a diagnosis, treatment plan, or clinical-engine result.' as const;

export function hasActiveRedFlags(flagIds: string[]): boolean {
  return flagIds.some((id) => RED_FLAG_OPTIONS.some((o) => o.id === id));
}

export function isVeryHighBpEntered(systolic: string, diastolic: string): boolean {
  const sys = Number(systolic);
  const dia = Number(diastolic);
  return (Number.isFinite(sys) && sys >= 180) || (Number.isFinite(dia) && dia >= 120);
}
