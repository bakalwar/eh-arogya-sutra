import { NextRequest } from 'next/server';
import { hasAuthDatabase, getPool } from '@/lib/auth/pg';
import { requireApiAuth } from '@/lib/auth/requireApiAuth';
import { proxyAuthToNode } from '@/lib/auth/proxyToNode';
import { buildPatientPayload, patientToApi, type PatientRow } from '@/lib/patients/handlers';

export async function GET(request: NextRequest) {
  if (!hasAuthDatabase()) {
    return proxyAuthToNode(request, 'patients');
  }

  const auth = requireApiAuth(request);
  if (auth instanceof Response) return auth;

  try {
    const res = await getPool().query<PatientRow>(
      `SELECT id, name, age, gender, weight, mobile, personal_factor, photo_url, symptoms, notes, created_at, updated_at
       FROM patients
       ORDER BY updated_at DESC NULLS LAST, created_at DESC`
    );
    return Response.json({ success: true, data: res.rows.map(patientToApi) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load patients';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!hasAuthDatabase()) {
    return proxyAuthToNode(request, 'patients');
  }

  const auth = requireApiAuth(request);
  if (auth instanceof Response) return auth;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.photoUrl && String(body.photoUrl).length > 240000) {
      return Response.json({ success: false, message: 'Photo payload too large' }, { status: 400 });
    }

    const payload = buildPatientPayload(body, true);
    if (!payload) {
      return Response.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const symptoms = Array.isArray(payload.symptoms) ? payload.symptoms : [];
    const res = await getPool().query<PatientRow>(
      `INSERT INTO patients (doctor_id, name, age, gender, weight, mobile, personal_factor, photo_url, symptoms, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, age, gender, weight, mobile, personal_factor, photo_url, symptoms, notes, created_at, updated_at`,
      [
        auth.id,
        payload.name,
        payload.age ?? null,
        payload.gender ?? null,
        payload.weight ?? null,
        payload.mobile ?? null,
        payload.personal_factor ?? null,
        payload.photo_url ?? null,
        symptoms,
        payload.notes ?? null,
      ]
    );

    return Response.json({ success: true, data: patientToApi(res.rows[0]) }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create patient';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}
