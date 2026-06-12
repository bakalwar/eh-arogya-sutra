/**
 * EH Engine Service
 * Node.js se eh_api.py (9 Rule Engines + summary_engine.py) ko call karta hai
 */

const EH_API_URL = process.env.EH_API_URL || 'http://localhost:8005';
const EH_API_KEY = process.env.EH_API_KEY || 'EH_TEST_KEY_2026';

/**
 * EH Arogya Sutra API v3.0 se prescription lo
 */
const analyzeWithEHEngines = async (patientData) => {
  try {
    const response = await fetch(`${EH_API_URL}/api/v3/prescribe`, {
      method:  'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': EH_API_KEY
      },
      body: JSON.stringify({
        patient_name:    patientData.name         || '',
        age:             parseInt(patientData.age) || 30,
        gender:          patientData.gender       || 'Male',
        bp_systolic:     parseInt(patientData.bp_systolic)  || 120,
        bp_diastolic:    parseInt(patientData.bp_diastolic) || 80,
        symptoms:        patientData.symptoms     || '',
        condition:       patientData.nature       || 'chronic',
      }),
      timeout: Number(process.env.EH_EXPERT_TIMEOUT_MS) || 120000,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `EH API error: ${response.status}`);
    }

    const rawData = await response.json();
    
    // Map eh_api.py v3.1 response to App-compatible format
    const mappedData = {
      prakriti: { 
        prakriti: rawData.clinical_analysis?.prakriti || 'Mixed',
        prakriti_hindi: rawData.clinical_analysis?.prakriti === 'SANGUINE' ? 'Sanguine (रक्त)' :
                        rawData.clinical_analysis?.prakriti === 'LYMPHATIC' ? 'Lymphatic (रस)' :
                        rawData.clinical_analysis?.prakriti === 'NERVOUS' ? 'Nervous (तंत्रिका)' : 'Mixed (मिश्रित)'
      },
      polarity: {
        polarity: rawData.clinical_analysis?.polarity || 'MIXED',
        polarity_hindi: rawData.clinical_analysis?.polarity === 'POSITIVE' ? 'POSITIVE (धनात्मक)' :
                        rawData.clinical_analysis?.polarity === 'NEGATIVE' ? 'NEGATIVE (ऋणात्मक)' : 'MIXED (मिश्रित)'
      },
      potency: {
        potency: rawData.clinical_analysis?.potency || 'D10',
        potency_type: rawData.clinical_analysis?.potency_type || 'SAMANYA',
        note: rawData.clinical_analysis?.potency_note || ''
      },
      mixtures: (rawData.mixtures || []).map(m => ({
        ...m,
        label: m.label || 'MIXTURE',
        name_en: m.name_en || m.system || '',
        formula_obj: m.formula_obj || m.fo || { full: m.formula || '--' },
        schedule: m.schedule || 'As directed'
      })),
      active_systems: rawData.clinical_analysis?.active_systems || [],
      safety: {
        overall_status: rawData.safety?.status || 'SAFE',
        summary: rawData.safety?.reason || '',
        antidote: rawData.safety?.antidote || 'Nimbu-Sirka'
      },
      dosage: rawData.dosage || { matra: '10 drops', frequency: '3-4 times' },
      diet: rawData.diet || { pathya: [], apathya: [] },
      parcha: rawData.summary || rawData.clinical_summary || rawData.parcha || '',
      clinical_summary: rawData.summary || rawData.clinical_summary || rawData.parcha || '',
      electricity: { elec: rawData.clinical_analysis?.electricity || rawData.electricity?.elec || 'BE' },
      engine_result: rawData.engine_result || null
    };

    return { success: true, data: mappedData };

  } catch (error) {
    console.error('EH API call failed:', error.message);
    return {
      success: false,
      error:   error.message,
      fallback: true,
      data: {
        prakriti:  { prakriti: 'KAF', prakriti_hindi: 'कफ प्रकृति' },
        polarity:  { polarity: 'MIXED', polarity_hindi: 'मिश्रित' },
        potency:   { potency: 'D5', matra_name: 'सामान्य मात्रा' },
        mixtures:  [],
        safety:    { overall_status: 'SAFE', summary: 'API offline' },
        dosage:    { matra: '5 boonden', frequency: '3 baar' },
        diet:      { pathya: [], apathya: [] },
        parcha:    'EH API currently offline. Start: cd eh-api && uvicorn eh_api:app --port 8005',
      }
    };
  }
};

/**
 * API health check
 */
const checkEHEngineHealth = async () => {
  try {
    const res = await fetch(`${EH_API_URL}/api/health`, {
      signal: AbortSignal.timeout(3000)
    });
    const data = await res.json();
    return { online: true, ...data };
  } catch {
    return { online: false, message: 'API offline' };
  }
};

module.exports = {
  analyzeWithEHEngines,
  checkEHEngineHealth,
};
