function personalFactorFromName(name: string): number | null {
  const s = String(name || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!s) return null;
  let sum = 0;
  for (let i = 0; i < s.length; i += 1) sum += s.charCodeAt(i);
  let n = sum;
  while (n > 9) {
    n = String(n)
      .split('')
      .reduce((a, d) => a + Number(d), 0);
  }
  return n || 9;
}

export interface PatientRow {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  weight: number | null;
  mobile: string | null;
  personal_factor: number | null;
  photo_url: string | null;
  symptoms: string[] | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export function patientToApi(row: PatientRow) {
  return {
    id: String(row.id),
    name: row.name,
    age: row.age ?? undefined,
    gender: row.gender ?? undefined,
    weight: row.weight ?? undefined,
    mobile: row.mobile ?? undefined,
    personalFactor: row.personal_factor ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    symptoms: row.symptoms || [],
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function buildPatientPayload(body: Record<string, unknown>, forCreate = false) {
  const payload: Record<string, unknown> = {};
  if (body.name != null && body.name !== '') payload.name = String(body.name).trim();
  if (body.age != null && body.age !== '') payload.age = Number(body.age);
  if (body.gender != null && body.gender !== '') payload.gender = String(body.gender).trim();
  if (body.weight != null && body.weight !== '') payload.weight = Number(body.weight);
  if (body.mobile != null && body.mobile !== '') payload.mobile = String(body.mobile).trim();
  if (body.photoUrl !== undefined) payload.photo_url = body.photoUrl;
  if (body.notes !== undefined) payload.notes = body.notes;
  if (Array.isArray(body.symptoms)) payload.symptoms = body.symptoms;

  let pf = body.personalFactor;
  if ((pf == null || pf === '') && body.name) {
    const computed = personalFactorFromName(String(body.name));
    if (computed != null) pf = computed;
  }
  if (pf != null && pf !== '') payload.personal_factor = Number(pf);

  if (forCreate && !payload.name) return null;
  return payload;
}
