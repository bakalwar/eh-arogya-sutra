/**
 * Face analysis — prefers EH Expert MediaPipe API; browser canvas fallback.
 */
import client from '../api/client';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function analyzeFacePhotoExpert(file) {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await client.post('/api/expert/analyze-face', fd, {
    timeout: 90000,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (!data?.success || !data?.data?.ok) {
    throw new Error(data?.message || data?.data?.error || 'Expert face analysis failed');
  }
  const r = data.data;
  const previewUrl = await fileToDataUrl(file);
  return {
    findings: r.findings || [],
    vitiation: r.vitiation || 'MIXED',
    polarity: r.polarity || 'MIXED',
    blood_score: r.blood_score ?? 0,
    lymph_score: r.lymph_score ?? 0,
    polarity_score: r.polarity_score ?? 0,
    confidence: r.confidence ?? 0,
    total_signs: r.total_signs ?? (r.findings?.length || 0),
    temperament: r.temperament,
    skin_color: r.skin_color,
    face_detected: r.face_detected,
    engine: r.engine || 'mediapipe',
    previewUrl,
    face_image_base64: previewUrl
  };
}

function getZoneColors(data, width, height, startY, endY, startX = 0, endX = 1) {
  const startRow = Math.floor(height * startY);
  const endRow = Math.floor(height * endY);
  const startCol = Math.floor(width * startX);
  const endCol = Math.floor(width * endX);
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let pixelCount = 0;

  for (let y = startRow; y < endRow; y++) {
    for (let x = startCol; x < endCol; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] < 128) continue;
      totalR += data[idx];
      totalG += data[idx + 1];
      totalB += data[idx + 2];
      pixelCount++;
    }
  }

  if (!pixelCount) return { r: 128, g: 128, b: 128 };
  return { r: totalR / pixelCount, g: totalG / pixelCount, b: totalB / pixelCount };
}

function analyzeEyeZone(color) {
  const { r, g, b } = color;
  const findings = [];
  let bloodScore = 0;
  let lymphScore = 0;
  let polarityScore = 0;

  if (r > 180 && g > 160 && b < 100) {
    findings.push({
      sign: 'Peeli Aankhein (Yellow Eyes)',
      meaning: 'Liver aur Lymph mein samasya',
      vitiation: 'LYMPHATIC',
      polarity: 'POSITIVE',
      severity: 'moderate',
      zone: 'eyes'
    });
    lymphScore += 2;
    polarityScore += 1;
  }
  if (r > 200 && g < 120 && b < 120) {
    findings.push({
      sign: 'Laal Aankhein (Red Eyes)',
      meaning: 'Rakt Vitiation - Positive Rog',
      vitiation: 'SANGUINE',
      polarity: 'POSITIVE',
      severity: 'moderate',
      zone: 'eyes'
    });
    bloodScore += 2;
    polarityScore += 2;
  }
  if (r < 100 && g < 100 && b < 100) {
    findings.push({
      sign: 'Aankhon ke Neeche Kaale Ghaire',
      meaning: 'Kidney aur Lymph kamzor - Negative Rog',
      vitiation: 'LYMPHATIC',
      polarity: 'NEGATIVE',
      severity: 'mild',
      zone: 'eyes'
    });
    lymphScore += 1;
    polarityScore -= 1;
  }

  return { findings, bloodScore, lymphScore, polarityScore };
}

function analyzeSkinZone(cheek, overall) {
  const { r, g, b } = cheek;
  const findings = [];
  let bloodScore = 0;
  let lymphScore = 0;
  let polarityScore = 0;

  if (g > r && g > b && r > 150 && b < 130) {
    findings.push({
      sign: 'Peeli Twacha (Yellow Skin)',
      meaning: 'Lymph Vitiation - Sanguine ya Lymphatic samasya',
      vitiation: 'LYMPHATIC',
      polarity: 'NEGATIVE',
      severity: 'moderate',
      zone: 'skin'
    });
    lymphScore += 2;
    polarityScore -= 1;
  }
  if (r > 200 && r > g * 1.3 && r > b * 1.3) {
    findings.push({
      sign: 'Laal Twacha (Flushed Skin)',
      meaning: 'Rakt Vitiation - Positive Rog - Sujan ya Bukhar',
      vitiation: 'SANGUINE',
      polarity: 'POSITIVE',
      severity: 'moderate',
      zone: 'skin'
    });
    bloodScore += 2;
    polarityScore += 2;
  }
  if (r > 220 && g > 210 && b > 200 && r - g < 25) {
    findings.push({
      sign: 'Safed/Pheeki Twacha (Pale Skin)',
      meaning: 'Rakt ki Kami - Negative Rog - Kamzori',
      vitiation: 'SANGUINE',
      polarity: 'NEGATIVE',
      severity: 'mild',
      zone: 'skin'
    });
    bloodScore += 1;
    polarityScore -= 2;
  }
  if (r < 120 && g < 110 && b < 100) {
    findings.push({
      sign: 'Dhabbe ya Kala Rang (Dark Patches)',
      meaning: 'Mixed Vitiation - Blood aur Lymph dono prabhavit',
      vitiation: 'MIXED',
      polarity: 'MIXED',
      severity: 'mild',
      zone: 'skin'
    });
    bloodScore += 1;
    lymphScore += 1;
  }

  const oR = overall?.r || r;
  if (oR > 0 && r > oR * 1.15 && g > 140) {
    findings.push({
      sign: 'Sujan Bhara Chehra (Puffy Face)',
      meaning: 'Positive Rog - inflammation',
      vitiation: 'LYMPHATIC',
      polarity: 'POSITIVE',
      severity: 'mild',
      zone: 'skin'
    });
    lymphScore += 1;
    polarityScore += 1;
  }

  return { findings, bloodScore, lymphScore, polarityScore };
}

function analyzeLipsZone(color) {
  const { r, g, b } = color;
  const findings = [];
  let bloodScore = 0;
  let lymphScore = 0;
  let polarityScore = 0;

  if (r > 180 && r > g * 1.5) {
    findings.push({
      sign: 'Bahut Laal Hont (Very Red Lips)',
      meaning: 'Positive Rog - Garmi ya Bukhar ka sanket',
      vitiation: 'SANGUINE',
      polarity: 'POSITIVE',
      severity: 'mild',
      zone: 'lips'
    });
    bloodScore += 1;
    polarityScore += 1;
  }
  if (r < 150 && r < g * 1.1) {
    findings.push({
      sign: 'Pheeke Hont (Pale Lips)',
      meaning: 'Rakt ki Kami (Anemia) - Negative Rog',
      vitiation: 'SANGUINE',
      polarity: 'NEGATIVE',
      severity: 'moderate',
      zone: 'lips'
    });
    bloodScore += 2;
    polarityScore -= 2;
  }
  if (b > r && b > 120) {
    findings.push({
      sign: 'Neele Hont (Blue/Purple Lips)',
      meaning: 'Rakt Sanchar ki Samasya - Negative Rog',
      vitiation: 'SANGUINE',
      polarity: 'NEGATIVE',
      severity: 'severe',
      zone: 'lips'
    });
    bloodScore += 3;
    polarityScore -= 3;
  }

  return { findings, bloodScore, lymphScore, polarityScore };
}

function analyzeForeheadZone(color) {
  const { r, g, b } = color;
  const findings = [];
  let polarityScore = 0;
  let bloodScore = 0;
  let lymphScore = 0;

  if (r > 210 && g > 200 && b > 180) {
    findings.push({
      sign: 'Chamkila Maatha (Shiny Forehead)',
      meaning: 'Positive energy - Inflammation ya heat',
      vitiation: 'SANGUINE',
      polarity: 'POSITIVE',
      severity: 'mild',
      zone: 'forehead'
    });
    polarityScore += 1;
    bloodScore += 1;
  }
  if (r < 140 && g < 130 && b < 120) {
    findings.push({
      sign: 'Rukha Maatha (Dry Forehead)',
      meaning: 'Negative Rog - Dehydration ya Kamzori',
      vitiation: 'MIXED',
      polarity: 'NEGATIVE',
      severity: 'mild',
      zone: 'forehead'
    });
    polarityScore -= 1;
  }

  return { findings, bloodScore, lymphScore, polarityScore };
}

function combineAnalysis(eye, skin, lips, forehead) {
  const allFindings = [...eye.findings, ...skin.findings, ...lips.findings, ...forehead.findings];
  const totalBlood = eye.bloodScore + skin.bloodScore + lips.bloodScore + forehead.bloodScore;
  const totalLymph = eye.lymphScore + skin.lymphScore + lips.lymphScore + forehead.lymphScore;
  const totalPolarity =
    eye.polarityScore + skin.polarityScore + lips.polarityScore + forehead.polarityScore;

  const vitiation =
    totalBlood > totalLymph
      ? 'SANGUINE (Blood)'
      : totalLymph > totalBlood
        ? 'LYMPHATIC (Lymph)'
        : 'MIXED VITIATION';

  const polarity =
    totalPolarity > 1 ? 'POSITIVE' : totalPolarity < -1 ? 'NEGATIVE' : 'MIXED';

  const confidence = Math.min(85, 40 + allFindings.length * 10);

  return {
    findings: allFindings,
    vitiation,
    polarity,
    blood_score: totalBlood,
    lymph_score: totalLymph,
    polarity_score: totalPolarity,
    confidence,
    total_signs: allFindings.length,
    zones: {
      eyes: eye.findings,
      skin: skin.findings,
      lips: lips.findings,
      forehead: forehead.findings
    }
  };
}

function analyzePixels(imageData, img) {
  const data = imageData.data;
  const width = img.width;
  const height = img.height;

  const eyeZone = getZoneColors(data, width, height, 0.05, 0.35);
  const cheekZone = getZoneColors(data, width, height, 0.35, 0.65, 0.15, 0.85);
  const lipsZone = getZoneColors(data, width, height, 0.6, 0.78, 0.3, 0.7);
  const foreheadZone = getZoneColors(data, width, height, 0, 0.2);
  const overallZone = getZoneColors(data, width, height, 0.1, 0.9);

  const eyeAnalysis = analyzeEyeZone(eyeZone);
  const skinAnalysis = analyzeSkinZone(cheekZone, overallZone);
  const lipsAnalysis = analyzeLipsZone(lipsZone);
  const foreheadAnalysis = analyzeForeheadZone(foreheadZone);

  return combineAnalysis(eyeAnalysis, skinAnalysis, lipsAnalysis, foreheadAnalysis);
}

function loadImageFromFile(imageFile) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/** Center crop toward face region when photo is full-body or wide */
function centerFaceCrop(img) {
  const side = Math.min(img.width, img.height);
  const x = Math.floor((img.width - side) / 2);
  const y = Math.floor((img.height - side) * 0.12);
  return { x, y, w: side, h: Math.min(side, img.height - y) };
}

async function analyzeFacePhotoBrowser(imageFile) {
  const img = await loadImageFromFile(imageFile);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const crop = centerFaceCrop(img);
  const maxW = 640;
  const scale = Math.min(1, maxW / crop.w);
  canvas.width = Math.round(crop.w * scale);
  canvas.height = Math.round(crop.h * scale);
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = analyzePixels(imageData, { width: canvas.width, height: canvas.height });
  const previewUrl = canvas.toDataURL('image/jpeg', 0.85);
  return {
    ...result,
    previewUrl,
    face_image_base64: previewUrl,
    engine: 'browser-canvas'
  };
}

/** MediaPipe (server) when expert-engine is up; else in-browser zones. */
export async function analyzeFacePhoto(imageFile) {
  try {
    return await analyzeFacePhotoExpert(imageFile);
  } catch {
    return analyzeFacePhotoBrowser(imageFile);
  }
}

export function vitiationLevel(score) {
  if (score >= 3) return 'HIGH';
  if (score >= 1) return 'MEDIUM';
  return 'LOW';
}
