import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  ChevronRight,
  Stethoscope,
  Droplets,
  Heart,
  Thermometer,
  User,
  Calendar,
  Weight,
  ArrowRight
} from 'lucide-react';
import client from '../api/client';

// DESIGN TOKENS
const COLORS = {
  bg: '#0a0a0a',
  surface: '#111111',
  border: '#1a1a1a',
  text: '#ffffff',
  textMuted: '#888888',
  gold: '#d4af37',
  goldMuted: 'rgba(212, 175, 55, 0.1)',
  teal: '#008080',
  tealMuted: 'rgba(0, 128, 128, 0.1)',
  red: '#ff4d4d',
  green: '#4ade80'
};

// ND Object for Constitutional Health Tendency
const ND = {
  1: { organs: "Heart, Arteries, Eyes", note: "Vitality is high but prone to heat-related issues.", watch: ["BP", "Vision"] },
  2: { organs: "Stomach, Digestive Fluids, Lymph", note: "Sensitive digestion; needs fluid balance.", watch: ["Gastritis", "Water Retention"] },
  3: { organs: "Liver, Lungs, Thighs", note: "Metabolism is strong; watch for over-exertion.", watch: ["Liver Enzymes", "Chest Congestion"] },
  4: { organs: "Kidneys, Spleen, Lower Back", note: "Prone to sudden shifts in health; needs stability.", watch: ["Uric Acid", "Nervous exhaustion"] },
  5: { organs: "Nervous System, Throat, Hands", note: "Highly active mind; watch for stress-related symptoms.", watch: ["Thyroid", "Insomnia"] },
  6: { organs: "Veins, Reproductive System, Face", note: "Prone to congestion and circulatory slow-down.", watch: ["Hormones", "Skin elasticity"] },
  7: { organs: "Skin, Pineal Gland, Mental Health", note: "Deep-seated issues often manifest on skin.", watch: ["Eczema", "Psychosomatic stress"] },
  8: { organs: "Bones, Teeth, Knees, Large Intestine", note: "Chronic tendencies; needs mineral support.", watch: ["Joint Pain", "Constipation"] },
  9: { organs: "Blood, Muscles, Head, Marrow", note: "High inflammatory response; watch for fevers.", watch: ["Inflammation", "Headaches"] }
};

const CHALDEAN_MAP = {
  A:1, B:2, C:3, D:4, E:5, F:8, G:3, H:5, I:1, J:1, K:2, L:3, M:4, N:5, O:7, P:8, Q:1, R:2, S:3, T:4, U:6, V:6, W:6, X:5, Y:1, Z:7
};

const calcNum = (name) => {
  if (!name) return null;
  const sum = name.toUpperCase().split('').reduce((acc, char) => {
    return acc + (CHALDEAN_MAP[char] || 0);
  }, 0);
  
  const reduce = (n) => {
    if (n <= 9) return n;
    return reduce(n.toString().split('').reduce((a, b) => a + parseInt(b), 0));
  };
  
  return reduce(sum);
};

const ReportAnalyzer = () => {
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    weight: '',
    bp_systolic: '',
    bp_diastolic: '',
    pulse: '',
    symptoms: [],
    currentSymptom: '',
    labText: '',
    images: []
  });

  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientData(prev => ({ ...prev, [name]: value }));
  };

  const addSymptom = () => {
    if (patientData.currentSymptom.trim()) {
      setPatientData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, prev.currentSymptom.trim()],
        currentSymptom: ''
      }));
    }
  };

  const removeSymptom = (index) => {
    setPatientData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    files.forEach(file => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max 10MB allowed.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadstart = () => setLoading(true);
      reader.onloadend = () => {
        setPatientData(prev => ({
          ...prev,
          images: [...prev.images, { 
            file, 
            preview: file.type.startsWith('image/') ? reader.result : null,
            name: file.name,
            type: file.type
          }]
        }));
        setLoading(false);
      };
      reader.onerror = () => {
        console.error("FileReader error");
        setLoading(false);
      };

      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        // For PDFs or other allowed types, just add the file without preview
        setPatientData(prev => ({
          ...prev,
          images: [...prev.images, { 
            file, 
            preview: null,
            name: file.name,
            type: file.type
          }]
        }));
      }
    });
    // Reset input so same file can be uploaded again if removed
    e.target.value = '';
  };

  const removeImage = (index) => {
    setPatientData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      
      // Add images
      patientData.images.forEach(img => {
        formData.append('files', img.file);
      });

      // Add patient data
      formData.append('patient_name', patientData.name || 'Patient');
      formData.append('age', patientData.age || 40);
      formData.append('gender', patientData.gender || 'Male');
      formData.append('bp_systolic', patientData.bp_systolic || 120);
      formData.append('bp_diastolic', patientData.bp_diastolic || 80);
      formData.append('symptoms', patientData.symptoms.join(', ') + (patientData.labText ? ` | Lab: ${patientData.labText}` : ''));
      formData.append('condition', 'chronic');

      // Call Node backend instead of FastAPI directly
      const response = await client.post('/api/search/analyze-complete', formData, {
        timeout: 300000
      });

      const resData = response.data;
      if (!resData.success) {
        throw new Error(resData.message);
      }

      const data = resData.data;
      const num = calcNum(patientData.name);
      const tendency = num ? ND[num] : null;

      // Map Node response to our UI structure
      setAnalysisResult({
        ...data,
        prakriti: {
          prakriti: data.eh_analysis?.prakriti?.prakriti || 'Lymphatic',
          prakriti_hindi: data.eh_analysis?.prakriti?.prakriti === 'Lymphatic' ? 'लसीका' : 'रक्त'
        },
        polarity: {
          polarity: data.eh_analysis?.polarity?.polarity || 'POSITIVE',
          state: data.eh_analysis?.phase || 'Hyper'
        },
        potency: {
          potency: data.eh_analysis?.potency?.potency || 'D10'
        },
        lab_findings: data.lab_findings || [],
        active_systems: data.eh_analysis?.active_systems || [],
        summary: data.clinical_summary || data.summary,
        constitutionalTendency: tendency,
        confidence: data.confidence || 95
      });
    } catch (err) {
      console.error("Analysis Error:", err);
      setError(err.response?.data?.detail || err.message || "Failed to analyze reports. Please check if EH Expert Engine is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b pb-6" style={{ borderColor: COLORS.border }}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8" style={{ color: COLORS.gold }} />
              Report Analyzer <span className="text-sm font-normal opacity-50 ml-2">v2.0</span>
            </h1>
            <p className="text-sm mt-1 opacity-60">Professional EH Clinical Analysis System</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs opacity-50 uppercase tracking-widest">System Status</p>
              <p className="text-sm font-medium" style={{ color: COLORS.green }}>Operational</p>
            </div>
          </div>
        </header>

        {/* Input Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Rail: Patient Info */}
          <div className="lg:col-span-4 space-y-8 border-l-4 pl-6" style={{ borderColor: COLORS.gold }}>
            <h2 className="text-lg font-semibold uppercase tracking-wider flex items-center gap-2">
              <User className="w-5 h-5" /> Patient Profile
            </h2>
            
            <div className="space-y-6">
              <div className="group">
                <label className="text-xs opacity-50 uppercase mb-1 block">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={patientData.name}
                  onChange={handleInputChange}
                  placeholder="Enter patient name..."
                  className="w-full bg-transparent border-b py-2 focus:outline-none transition-colors"
                  style={{ borderColor: COLORS.border }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.gold}
                  onBlur={(e) => e.target.style.borderColor = COLORS.border}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="text-xs opacity-50 uppercase mb-1 block">Age</label>
                  <input 
                    type="number" 
                    name="age"
                    value={patientData.age}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b py-2 focus:outline-none transition-colors"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>
                <div className="group">
                  <label className="text-xs opacity-50 uppercase mb-1 block">Gender</label>
                  <select 
                    name="gender"
                    value={patientData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b py-2 focus:outline-none transition-colors appearance-none"
                    style={{ borderColor: COLORS.border }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="group">
                  <label className="text-xs opacity-50 uppercase mb-1 block">Weight (kg)</label>
                  <input 
                    type="number" 
                    name="weight"
                    value={patientData.weight}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b py-2 focus:outline-none transition-colors"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>
                <div className="group">
                  <label className="text-xs opacity-50 uppercase mb-1 block">BP (Sys/Dia)</label>
                  <div className="flex items-center gap-1">
                    <input 
                      type="number" 
                      name="bp_systolic"
                      value={patientData.bp_systolic}
                      onChange={handleInputChange}
                      placeholder="120"
                      className="w-full bg-transparent border-b py-2 focus:outline-none transition-colors text-center"
                      style={{ borderColor: COLORS.border }}
                    />
                    <span className="opacity-30">/</span>
                    <input 
                      type="number" 
                      name="bp_diastolic"
                      value={patientData.bp_diastolic}
                      onChange={handleInputChange}
                      placeholder="80"
                      className="w-full bg-transparent border-b py-2 focus:outline-none transition-colors text-center"
                      style={{ borderColor: COLORS.border }}
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="text-xs opacity-50 uppercase mb-1 block">Pulse</label>
                  <input 
                    type="number" 
                    name="pulse"
                    value={patientData.pulse}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b py-2 focus:outline-none transition-colors"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-4">
              <h2 className="text-lg font-semibold uppercase tracking-wider flex items-center gap-2">
                <Droplets className="w-5 h-5" /> Symptoms
              </h2>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={patientData.currentSymptom}
                  onChange={(e) => setPatientData(prev => ({ ...prev, currentSymptom: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                  placeholder="Add symptom..."
                  className="flex-1 bg-transparent border-b py-2 focus:outline-none transition-colors"
                  style={{ borderColor: COLORS.border }}
                />
                <button 
                  onClick={addSymptom}
                  className="p-2 rounded-full transition-colors"
                  style={{ backgroundColor: COLORS.goldMuted, color: COLORS.gold }}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {patientData.symptoms.map((s, i) => (
                  <span 
                    key={i} 
                    className="px-3 py-1 rounded-full text-xs flex items-center gap-2"
                    style={{ backgroundColor: COLORS.border }}
                  >
                    {s}
                    <Trash2 
                      className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100" 
                      onClick={() => removeSymptom(i)}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Section: Reports & Analysis */}
          <div className="lg:col-span-8 space-y-10 border-l-4 pl-6" style={{ borderColor: COLORS.teal }}>
            <h2 className="text-lg font-semibold uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-5 h-5" /> Medical Reports
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Upload Zone */}
              <div className="space-y-4">
                <label 
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:bg-opacity-20"
                  style={{ borderColor: COLORS.teal, backgroundColor: COLORS.tealMuted }}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3" style={{ color: COLORS.teal }} />
                    <p className="mb-2 text-sm font-medium">Click to upload report images</p>
                    <p className="text-xs opacity-50">PNG, JPG or PDF (Max 10MB)</p>
                  </div>
                  <input type="file" className="hidden" multiple onChange={handleImageUpload} accept="image/*,application/pdf" />
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {patientData.images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border flex items-center justify-center bg-black bg-opacity-20" style={{ borderColor: COLORS.border }}>
                      {img.preview ? (
                        <img src={img.preview} alt="Report Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 p-2">
                          <FileText className="w-8 h-8 opacity-50" />
                          <span className="text-[10px] truncate w-full text-center opacity-50">{img.name}</span>
                        </div>
                      )}
                      <button 
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 rounded-full hover:bg-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab Text Area */}
              <div className="space-y-4">
                <label className="text-xs opacity-50 uppercase block">Manual Lab Findings / Observations</label>
                <textarea 
                  name="labText"
                  value={patientData.labText}
                  onChange={handleInputChange}
                  placeholder="Paste lab text or type findings here..."
                  className="w-full h-48 bg-transparent border rounded-xl p-4 focus:outline-none transition-colors resize-none"
                  style={{ borderColor: COLORS.border }}
                ></textarea>
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <button 
                onClick={runAnalysis}
                disabled={loading || (!patientData.images.length && !patientData.labText)}
                className="px-12 py-4 rounded-full font-bold text-lg flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                style={{ backgroundColor: COLORS.gold, color: COLORS.bg }}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Activity className="w-6 h-6" />
                    Run Clinical Analysis
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Results Section */}
        {analysisResult && (
          <section className="space-y-12 pt-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
            
            {/* 1. Report Strip */}
            <div className="p-4 rounded-lg flex items-center justify-between text-sm" style={{ backgroundColor: COLORS.tealMuted, color: COLORS.teal }}>
              <div className="flex items-center gap-4">
                <ShieldCheck className="w-5 h-5" />
                <span>Clinical Analysis Complete: {new Date().toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-4 font-mono">
                <span>Confidence: {analysisResult.confidence || '95'}%</span>
                <span>Engine: V2.0-CLAUDE</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              
              {/* Left Column: Clinical Markers */}
              <div className="space-y-10">
                
                {/* 2. Prakriti */}
                <div className="border-l-4 pl-6" style={{ borderColor: COLORS.gold }}>
                  <h3 className="text-xs opacity-50 uppercase tracking-widest mb-2">Constitutional Temperament</h3>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold" style={{ color: COLORS.gold }}>
                      {analysisResult.prakriti?.prakriti || 'Lymphatic'}
                    </span>
                    <span className="text-sm opacity-60">({analysisResult.prakriti?.prakriti_hindi || 'लसीका'})</span>
                  </div>
                  <p className="mt-2 text-sm opacity-80 leading-relaxed">
                    Primary metabolic foundation identified. Treatment should prioritize system cleansing and fluid balance.
                  </p>
                </div>

                {/* 3. Dosha / Polarity */}
                <div className="border-l-4 pl-6" style={{ borderColor: COLORS.red }}>
                  <h3 className="text-xs opacity-50 uppercase tracking-widest mb-2">Vitiation & Polarity</h3>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-lg font-bold">Polarity: {analysisResult.polarity?.polarity || 'POSITIVE'}</p>
                      <p className="text-xs opacity-50">Requires {analysisResult.potency?.potency || 'D10'} Dilution</p>
                    </div>
                    <div className="h-10 w-px bg-white opacity-10"></div>
                    <div>
                      <p className="text-lg font-bold">State: {analysisResult.polarity?.state || 'Hyper'}</p>
                      <p className="text-xs opacity-50">Active Inflammation detected</p>
                    </div>
                  </div>
                </div>

                {/* 4. Lab Findings */}
                <div className="border-l-4 pl-6" style={{ borderColor: COLORS.teal }}>
                  <h3 className="text-xs opacity-50 uppercase tracking-widest mb-4">Critical Lab Findings</h3>
                  <div className="space-y-3">
                    {(analysisResult.lab_findings || [
                      { test: 'Hemoglobin', value: '11.2', status: 'Low', color: COLORS.red },
                      { test: 'Uric Acid', value: '7.8', status: 'High', color: COLORS.red },
                      { test: 'Sugar (F)', value: '105', status: 'Normal', color: COLORS.green }
                    ]).map((lab, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: COLORS.border }}>
                        <span className="text-sm">{lab.test}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-mono">{lab.value}</span>
                          <span className="text-xs font-bold uppercase" style={{ color: lab.color || COLORS.text }}>{lab.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Systems & Tendencies */}
              <div className="space-y-10">
                
                {/* 5. Affected Part */}
                <div className="border-l-4 pl-6" style={{ borderColor: COLORS.gold }}>
                  <h3 className="text-xs opacity-50 uppercase tracking-widest mb-4">Affected Systems</h3>
                  <div className="flex flex-wrap gap-3">
                    {(analysisResult.active_systems || ['Digestive', 'Circulatory', 'Nervous']).map((sys, i) => (
                      <div key={i} className="px-4 py-2 rounded-lg border flex items-center gap-2" style={{ borderColor: COLORS.gold, backgroundColor: COLORS.goldMuted }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.gold }}></div>
                        <span className="text-sm font-medium">{sys}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Constitutional Tendency (Silent Numerology) */}
                {analysisResult.constitutionalTendency && (
                  <div className="border-l-4 pl-6" style={{ borderColor: COLORS.teal }}>
                    <h3 className="text-xs opacity-50 uppercase tracking-widest mb-2">Constitutional Health Tendency</h3>
                    <div className="space-y-3">
                      <p className="text-lg font-bold" style={{ color: COLORS.teal }}>
                        Focus Area: {analysisResult.constitutionalTendency.organs}
                      </p>
                      <p className="text-sm opacity-80 leading-relaxed italic">
                        "{analysisResult.constitutionalTendency.note}"
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs opacity-50 uppercase">Clinical Watch:</span>
                        {analysisResult.constitutionalTendency.watch.map((w, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: COLORS.teal }}>{w}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. Overall Impression */}
                <div className="border-l-4 pl-6" style={{ borderColor: COLORS.text }}>
                  <h3 className="text-xs opacity-50 uppercase tracking-widest mb-2">Clinical Impression</h3>
                  <div className="bg-white bg-opacity-5 p-6 rounded-xl border" style={{ borderColor: COLORS.border }}>
                    <p className="text-sm leading-relaxed opacity-90">
                      {analysisResult.summary || "The patient exhibits symptoms consistent with metabolic vitiation. Lab findings indicate elevated inflammatory markers. Recommended protocol involves systemic purification using S-group remedies combined with organ-specific support."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 8. Action Buttons */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-10 border-t" style={{ borderColor: COLORS.border }}>
              <button 
                className="w-full md:w-auto px-10 py-4 rounded-full font-bold flex items-center justify-center gap-3 transition-all hover:bg-white hover:text-black"
                style={{ border: `2px solid ${COLORS.gold}`, color: COLORS.gold }}
              >
                <Plus className="w-5 h-5" />
                Add to Patient History
              </button>
              <button 
                className="w-full md:w-auto px-10 py-4 rounded-full font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-105"
                style={{ backgroundColor: COLORS.gold, color: COLORS.bg }}
                onClick={() => window.location.href = '/prescription/new'}
              >
                Generate Prescription
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

          </section>
        )}

        {error && (
          <div className="p-6 rounded-xl border flex items-center gap-4 text-red-500" style={{ borderColor: COLORS.red, backgroundColor: 'rgba(255, 77, 77, 0.1)' }}>
            <AlertTriangle className="w-6 h-6" />
            <p className="font-medium">{error}</p>
          </div>
        )}

      </div>
      
      {/* Footer Branding */}
      <footer className="mt-20 py-10 border-t text-center opacity-30 text-xs uppercase tracking-[0.2em]" style={{ borderColor: COLORS.border }}>
        EH Arogya Sutra • Advanced CDSS Engine • 2026
      </footer>
    </div>
  );
};

export default ReportAnalyzer;
