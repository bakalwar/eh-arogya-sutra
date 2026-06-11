import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  RotateCcw, 
  Sparkles, 
  Clock, 
  User, 
  Activity, 
  ShieldCheck, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

/**
 * EHPrescription_Jagamba
 * 
 * A print-ready A4 prescription component for Jagamba Health Clinic.
 * Follows the "Zero Hardcoded Medicines" rule — all data comes from engineResult.
 */

const SYSTEM_BENEFIT = {
  RENAL: "Stimulates glomerular filtration, reduces edema, promotes urinary excretion of metabolic waste.",
  CARDIAC: "Restores vascular tone, relaxes arterial stiffness, reduces blood pressure and cardiac workload.",
  JOINTS: "Reduces uric acid accumulation, improves synovial fluid quality, supports cartilage nutrition.",
  LIVER: "Activates bile flow, clears portal venous congestion, supports hepatic cell regeneration.",
  GASTRIC: "Regulates gastric acid and enzyme output, normalizes peristalsis, reduces bloating.",
  METABOLIC: "Activates lymphatic circulation, enhances cellular nutrition, rebuilds vital force.",
  NEURO: "Reduces nerve root inflammation, supports myelin repair, improves nerve conduction.",
  RESPIRATORY: "Relaxes bronchial smooth muscle, liquefies mucus, reduces chronic airway inflammation.",
  GYNE: "Clears pelvic lymphatic stagnation, corrects hormonal imbalance, heals mucosal lining.",
  SKIN: "Purifies blood, activates lymphatic toxin clearance, supports internal skin healing.",
  FEVER: "Modulates thermoregulatory center, calms autonomic nerve hyperactivity, supports immunity.",
  GLANDULAR: "Activates macrophage dissolution, improves lymph node drainage, corrects immune surveillance.",
  CONSTIPATION: "Tones intestinal smooth muscle, activates gastrocolic reflex, prevents toxic reabsorption.",
  PARASITIC: "Disrupts parasite attachment, neutralizes toxins, repairs gut mucosal damage."
};

const POLARITY_DESC = {
  POSITIVE: "POSITIVE condition — high dilution used to sedate hyperactive organ state.",
  NEGATIVE: "NEGATIVE condition — low dilution used to stimulate hypoactive organ function.",
  MIXED: "MIXED condition — moderate dilution used pending dominant polarity clarification."
};

const SYSTEM_DIET = {
  JOINTS: {
    avoid: "Pulses with skin (urad dal)\nRed meat, alcohol, beer\nCold/sour food\nLemon, vinegar during treatment",
    do: "Drink 3–4 litres warm water daily\nGentle joint exercises morning\nMoong dal, lauki, tinda\nWarm oil massage nightly"
  },
  RENAL: {
    avoid: "Salt — completely stop\nUrad dal, red meat\nCold drinks and cold water\nAlcohol and tobacco\nLemon, vinegar during treatment",
    do: "Drink 3 litres warm water daily\nBottle gourd, cucumber daily\nMoong dal, khichdi\nGentle 30 min walk"
  },
  CARDIAC: {
    avoid: "Salt, pickles, processed food\nFried/oily food\nAlcohol and tobacco\nCold drinks\nLemon, vinegar during treatment",
    do: "20 min brisk walk daily\n7–8 hours quality sleep\nMoong dal, lauki\nStress-free routine"
  },
  GASTRIC: {
    avoid: "Fried/oily food, junk food\nSpicy food, maida\nAlcohol and tobacco\nCold drinks\nLemon, vinegar during treatment",
    do: "Khichdi, moong dal daily\nDrink 2–3 litres warm water\nSmall meals — do not overeat\n15 min walk after meals"
  },
  LIVER: {
    avoid: "Alcohol — strictly stop\nFried/oily food\nProcessed/packaged food\nCold drinks\nLemon, vinegar during treatment",
    do: "Papaya, pomegranate daily\nDrink 3 litres warm water\nLight food — moong dal\n30 min morning walk"
  },
  DEFAULT: {
    avoid: "Fried/oily food, junk food\nAlcohol and tobacco\nCold water and cold drinks\nLemon, vinegar during treatment",
    do: "Drink 3 litres warm water daily\nLight balanced meals\n30 min walk daily\n7–8 hours quality sleep"
  }
};

const EHPrescription_Jagamba = ({ doctor, patient, engineResult }) => {
  const [editableMixtures, setEditableMixtures] = useState([]);
  const [benefits, setBenefits] = useState({
    condition: "",
    mixture_a: "",
    mixture_b: "",
    mixture_c: "",
    mixture_d: "",
    external: ""
  });
  const [diet, setDiet] = useState({ avoid: "", do: "" });
  const [nextVisit, setNextVisit] = useState("30 days");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  // Initialize state from props
  useEffect(() => {
    if (engineResult?.mixtures) {
      setEditableMixtures(engineResult.mixtures.map(m => ({
        ...m,
        dose: patient?.dosage?.drops ? `${patient.dosage.drops} drops` : "10 drops",
        instructions: patient?.dosage?.gap_between ? `In ½ cup warm water (${patient.dosage.gap_between})` : "In ½ cup warm water",
        timing: m.timing || patient?.dosage?.frequency || "3 times daily"
      })));
    }

    // Default benefits
    const primarySys = patient?.active_systems?.[0] || "METABOLIC";
    const newBenefits = {
      condition: POLARITY_DESC[patient?.polarity] || POLARITY_DESC.MIXED,
      mixture_a: engineResult?.mixtures?.[0] ? SYSTEM_BENEFIT[engineResult.mixtures[0].system] || "" : "",
      mixture_b: engineResult?.mixtures?.[1] ? SYSTEM_BENEFIT[engineResult.mixtures[1].system] || "" : "",
      mixture_c: engineResult?.mixtures?.[2] ? SYSTEM_BENEFIT[engineResult.mixtures[2].system] || "" : "",
      mixture_d: engineResult?.tablet ? "Sustained constitutional support to maintain steady metabolic balance." : "",
      external: engineResult?.external ? "Topical application for direct transdermal organ stimulation and pain relief." : ""
    };
    setBenefits(newBenefits);

    // Default diet
    const dietSource = engineResult?.diet || {};
    const systemDiet = SYSTEM_DIET[primarySys] || SYSTEM_DIET.DEFAULT;
    
    setDiet({
      avoid: dietSource.avoid?.join("\n") || systemDiet.avoid,
      do: [...(dietSource.eat || []), ...(dietSource.lifestyle || [])].join("\n") || systemDiet.do
    });

    // Default next visit
    const phaseMap = {
      acute: "7 days",
      sub_acute: "15 days",
      chronic: "30 days",
      degenerative: "45 days"
    };
    setNextVisit(phaseMap[patient?.phase] || "30 days");
  }, [engineResult, patient]);

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    const primarySys = patient?.active_systems?.[0] || "METABOLIC";
    setBenefits({
      condition: POLARITY_DESC[patient?.polarity] || POLARITY_DESC.MIXED,
      mixture_a: engineResult?.mixtures?.[0] ? SYSTEM_BENEFIT[engineResult.mixtures[0].system] || "" : "",
      mixture_b: engineResult?.mixtures?.[1] ? SYSTEM_BENEFIT[engineResult.mixtures[1].system] || "" : "",
      mixture_c: engineResult?.mixtures?.[2] ? SYSTEM_BENEFIT[engineResult.mixtures[2].system] || "" : "",
      mixture_d: engineResult?.tablet ? "Sustained constitutional support to maintain steady metabolic balance." : "",
      external: engineResult?.external ? "Topical application for direct transdermal organ stimulation and pain relief." : ""
    });
    setIsAiGenerated(false);
  };

  const generateAiBenefits = async () => {
    setIsAiGenerating(true);
    try {
      const formulaLines = editableMixtures.map((m, i) => `Mixture ${String.fromCharCode(65 + i)}: ${m.formula}`).join("\n");
      const prompt = `
You are an Electro-Homeopathy clinical expert (Count Mattei principles).
Generate 1-sentence clinical benefit descriptions.
Disease: ${patient?.disease || "General Condition"}
Polarity: ${patient?.polarity}
Active Systems: ${patient?.active_systems?.join(', ')}
Formulas (from engine — do NOT include these codes in descriptions):
${formulaLines}
Return ONLY this JSON (no markdown):
{
"condition": "one sentence about polarity and potency effect",
"mixture_a": "one sentence — clinical organ action of Mixture A",
"mixture_b": "one sentence — clinical organ action of Mixture B",
"mixture_c": "one sentence — clinical organ action of Mixture C",
"mixture_d": "one sentence — sustained tablet support benefit",
"external": "one sentence — topical oil benefit"
}
Rules:
- 1 sentence per field, pure English
- Describe organ-level action only
- Do NOT mention medicine codes (S6, C6, BE etc.)
- Focus on patient benefit and timeline
`;

      // Note: In a real app, this would call a backend endpoint that proxies to Anthropic
      // For this demo, we'll simulate a response or use a placeholder
      console.log("AI Prompt:", prompt);
      
      // Simulating API call
      setTimeout(() => {
        setIsAiGenerating(false);
        setIsAiGenerated(true);
        // In a real implementation, you'd parse the response and setBenefits
      }, 2000);

    } catch (error) {
      console.error("AI Generation failed:", error);
      setIsAiGenerating(false);
    }
  };

  const updateMixture = (index, field, value) => {
    const newMix = [...editableMixtures];
    newMix[index][field] = value;
    setEditableMixtures(newMix);
  };

  const updateBenefit = (field, value) => {
    setBenefits(prev => ({ ...prev, [field]: value }));
  };

  const updateDiet = (field, value) => {
    setDiet(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] p-4 sm:p-8 no-print" style={{ fontFamily: 'var(--font)' }}>
      {/* Prescription Toolbar */}
      <div className="mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-4 rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--gold-dim)] text-[var(--gold)]">
            <ShieldCheck size={18} />
          </div>
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-[var(--text-primary)]">Prescription Control</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[#B8822A] to-[#C9963A] px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[rgba(201,150,58,0.3)] hover:opacity-90 transition-all"
          >
            <Printer size={16} /> Print / PDF
          </button>
          <button
            onClick={generateAiBenefits}
            disabled={isAiGenerating}
            className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[#1A3D1C] to-[#2E6B30] px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[rgba(46,107,48,0.3)] hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isAiGenerating ? <Clock size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isAiGenerating ? "Generating..." : "AI Optimize"}
          </button>
          <button 
            onClick={handleReset}
            className="rounded-md border border-[var(--border-light)] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* A4 Prescription Sheet (White Paper) */}
      <div className="bg-white w-[210mm] min-h-[297mm] mx-auto shadow-2xl relative p-[10mm] print:shadow-none print:p-0 text-[#1A1A1A]" id="prescription-sheet">
        {/* Borders */}
        <div className="absolute inset-[5mm] border-[3px] border-[#1A3D1C] pointer-events-none"></div>
        <div className="absolute inset-[12mm] border border-[#1A3D1C44] pointer-events-none"></div>

        {/* Content Container */}
        <div className="relative z-10 p-8 flex flex-col h-full">
          
          {/* Clinic Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center items-center gap-3 mb-1">
              <div className="w-12 h-12 rounded-full border-2 border-[#1A3D1C] flex items-center justify-center text-[#1A3D1C]">
                <span className="text-2xl font-bold">⚕</span>
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1A3D1C] uppercase tracking-wider">
                {doctor?.clinic_name || "Jagamba Health Clinic"}
              </h1>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Contact: {doctor?.mobile || "9098791989"} | {doctor?.clinic_city || "Seoni"}, {doctor?.clinic_state || "M.P."}
            </p>
            <div className="mt-2 inline-block border-b-2 border-[#1A3D1C] px-8 pb-1">
              <h2 className="text-lg font-bold text-[#1A3D1C] uppercase tracking-widest">
                Electro-Homoeopathy Prescription
              </h2>
            </div>
          </div>

          {/* Patient Info Row */}
          <div className="grid grid-cols-5 gap-4 mb-4 text-sm border-b border-gray-200 pb-2">
            <div className="col-span-2 flex gap-2 items-baseline">
              <span className="font-bold text-[#1A3D1C]">Patient:</span>
              <span contentEditable suppressContentEditableWarning={true} className="flex-1 border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none px-1">
                {patient?.patient_name || "___________________"}
              </span>
            </div>
            <div className="flex gap-2 items-baseline">
              <span className="font-bold text-[#1A3D1C]">Age:</span>
              <span contentEditable suppressContentEditableWarning={true} className="w-12 border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none px-1">
                {patient?.age || "__"}
              </span>
            </div>
            <div className="flex gap-2 items-baseline">
              <span className="font-bold text-[#1A3D1C]">Sex:</span>
              <span contentEditable suppressContentEditableWarning={true} className="w-12 border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none px-1 text-center">
                {patient?.gender?.[0] || "_"}
              </span>
            </div>
            <div className="flex gap-2 items-baseline">
              <span className="font-bold text-[#1A3D1C]">Date:</span>
              <span contentEditable suppressContentEditableWarning={true} className="flex-1 border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none px-1">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Condition Row */}
          <div className="grid grid-cols-4 gap-4 mb-6 text-sm border-b border-gray-200 pb-2">
            <div className="flex gap-2 items-baseline">
              <span className="font-bold text-[#1A3D1C]">Condition:</span>
              <span contentEditable suppressContentEditableWarning={true} className="flex-1 border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none px-1 uppercase">
                {patient?.phase || "_______"}
              </span>
            </div>
            <div className="col-span-2 flex gap-2 items-baseline">
              <span className="font-bold text-[#1A3D1C]">Disease:</span>
              <span contentEditable suppressContentEditableWarning={true} className="flex-1 border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none px-1">
                {patient?.disease || "_____________________________"}
              </span>
            </div>
            <div className="flex gap-2 items-baseline">
              <span className="font-bold text-[#1A3D1C]">BP:</span>
              <span contentEditable suppressContentEditableWarning={true} className="w-20 border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none px-1">
                {patient?.bp_systolic && patient?.bp_diastolic ? `${patient.bp_systolic}/${patient.bp_diastolic}` : "___/___"}
              </span>
            </div>
          </div>

          {/* Prescription Table */}
          <div className="mb-6 overflow-hidden border border-[#C8DDC8]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1A3D1C] text-white text-[11px] uppercase tracking-wider">
                  <th className="p-2 border-r border-[#C8DDC8] w-10 text-center">No.</th>
                  <th className="p-2 border-r border-[#C8DDC8] w-40">Mixture / Timing</th>
                  <th className="p-2 border-r border-[#C8DDC8]">Formula</th>
                  <th className="p-2 border-r border-[#C8DDC8] w-20 text-center">Potency</th>
                  <th className="p-2 border-r border-[#C8DDC8] w-20 text-center">Dose</th>
                  <th className="p-2">Instructions</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {editableMixtures.map((mix, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? "bg-[#F5FBF5]" : "bg-white"}>
                    <td className="p-2 border-r border-[#C8DDC8] text-center font-bold">{idx + 1}</td>
                    <td className="p-2 border-r border-[#C8DDC8]">
                      <div className="font-bold text-[#1A3D1C]">Mixture {String.fromCharCode(65 + idx)}</div>
                      <div className="text-[10px] text-gray-500 uppercase">{mix.system}</div>
                      <div className="text-[10px] italic text-gray-400">{mix.timing}</div>
                    </td>
                    <td className="p-2 border-r border-[#C8DDC8]">
                      <input 
                        type="text"
                        value={mix.formula}
                        onChange={(e) => updateMixture(idx, 'formula', e.target.value)}
                        className="w-full font-mono text-[#1A3060] bg-transparent border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none"
                      />
                    </td>
                    <td className="p-2 border-r border-[#C8DDC8] text-center">
                      <span contentEditable suppressContentEditableWarning={true} onBlur={(e) => updateMixture(idx, 'dilution', e.target.innerText)} className="border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none">
                        {mix.dilution}
                      </span>
                    </td>
                    <td className="p-2 border-r border-[#C8DDC8] text-center">
                      <span contentEditable suppressContentEditableWarning={true} onBlur={(e) => updateMixture(idx, 'dose', e.target.innerText)} className="border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none">
                        {mix.dose}
                      </span>
                    </td>
                    <td className="p-2">
                      <span contentEditable suppressContentEditableWarning={true} onBlur={(e) => updateMixture(idx, 'instructions', e.target.innerText)} className="border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none">
                        {mix.instructions}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Tablet Row */}
                {engineResult?.tablet && (
                  <tr className="bg-white border-t border-[#C8DDC8]">
                    <td className="p-2 border-r border-[#C8DDC8] text-center font-bold">{editableMixtures.length + 1}</td>
                    <td className="p-2 border-r border-[#C8DDC8]">
                      <div className="font-bold text-[#1A3D1C]">Mixture D / Globules</div>
                      <div className="text-[10px] italic text-gray-400">3 times daily</div>
                    </td>
                    <td className="p-2 border-r border-[#C8DDC8]">
                      <input 
                        type="text"
                        value={engineResult.tablet.formula}
                        readOnly
                        className="w-full font-mono text-[#1A3060] bg-transparent outline-none"
                      />
                    </td>
                    <td className="p-2 border-r border-[#C8DDC8] text-center">{engineResult.tablet.dilution}</td>
                    <td className="p-2 border-r border-[#C8DDC8] text-center">3 tablets</td>
                    <td className="p-2">Dissolve under tongue</td>
                  </tr>
                )}

                {/* External Row */}
                {engineResult?.external && (
                  <tr className="bg-[#F5FBF5] border-t border-[#C8DDC8]">
                    <td className="p-2 border-r border-[#C8DDC8] text-center font-bold">{editableMixtures.length + (engineResult.tablet ? 2 : 1)}</td>
                    <td className="p-2 border-r border-[#C8DDC8]">
                      <div className="font-bold text-[#1A3D1C]">External Oil</div>
                      <div className="text-[10px] italic text-gray-400">Before sleep</div>
                    </td>
                    <td className="p-2 border-r border-[#C8DDC8]">
                      <input 
                        type="text"
                        value={engineResult.external.formula}
                        readOnly
                        className="w-full font-mono text-[#1A3060] bg-transparent outline-none"
                      />
                    </td>
                    <td className="p-2 border-r border-[#C8DDC8] text-center">{engineResult.external.dilution || "D4"}</td>
                    <td className="p-2 border-r border-[#C8DDC8] text-center">—</td>
                    <td className="p-2">Warm oil massage 15 min — {engineResult.external.location}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Medicine Details & Benefits Section */}
          <div className="mb-6 bg-[#F5FBF5] p-4 border border-[#C8DDC8] rounded">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-[#1A3D1C] uppercase tracking-wider flex items-center gap-2">
                Medicine Details & Benefits
                {isAiGenerated && <span className="text-[10px] bg-[#C9963A] text-white px-2 py-0.5 rounded-full">✨ AI Generated</span>}
              </h3>
            </div>
            <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <span className="font-bold text-[#1A3D1C] min-w-[100px]">Condition :</span>
                  <span 
                    contentEditable 
                    suppressContentEditableWarning={true}
                    onBlur={(e) => updateBenefit('condition', e.target.innerText)}
                    className="flex-1 border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none"
                  >
                    {benefits.condition}
                  </span>
                </div>
                {editableMixtures.map((mix, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="font-bold text-[#1A3D1C] min-w-[100px]">Mixture {String.fromCharCode(65 + idx)} :</span>
                    <span 
                      contentEditable 
                      suppressContentEditableWarning={true}
                      onBlur={(e) => updateBenefit(`mixture_${String.fromCharCode(97 + idx)}`, e.target.innerText)}
                      className="flex-1 border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none"
                    >
                      {benefits[`mixture_${String.fromCharCode(97 + idx)}`]}
                    </span>
                  </div>
                ))}
                {engineResult?.tablet && (
                  <div className="flex gap-2">
                    <span className="font-bold text-[#1A3D1C] min-w-[100px]">Mixture D :</span>
                    <span 
                      contentEditable 
                      suppressContentEditableWarning={true}
                      onBlur={(e) => updateBenefit('mixture_d', e.target.innerText)}
                      className="flex-1 border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none"
                    >
                      {benefits.mixture_d}
                    </span>
                  </div>
                )}
                {engineResult?.external && (
                  <div className="flex gap-2">
                    <span className="font-bold text-[#1A3D1C] min-w-[100px]">External :</span>
                    <span 
                      contentEditable 
                      suppressContentEditableWarning={true}
                      onBlur={(e) => updateBenefit('external', e.target.innerText)}
                      className="flex-1 border-b border-dashed border-transparent hover:border-[#C9963A] focus:border-[#C9963A] outline-none"
                    >
                      {benefits.external}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Avoid / Do Section */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="border border-[#C0392B44] rounded overflow-hidden">
                <div className="bg-[#C0392B] text-white text-[10px] font-bold uppercase p-1 px-3 flex items-center gap-2">
                  <AlertTriangle size={12} />
                  ✗ Avoid
                </div>
                <div 
                  contentEditable 
                  suppressContentEditableWarning={true}
                  onBlur={(e) => updateDiet('avoid', e.target.innerText)}
                  className="p-3 text-[11px] text-gray-700 min-h-[80px] outline-none whitespace-pre-line"
                >
                  {diet.avoid}
                </div>
              </div>
              <div className="border border-[#1A3D1C44] rounded overflow-hidden">
                <div className="bg-[#1A3D1C] text-white text-[10px] font-bold uppercase p-1 px-3 flex items-center gap-2">
                  <ShieldCheck size={12} />
                  ✓ Do
                </div>
                <div 
                  contentEditable 
                  suppressContentEditableWarning={true}
                  onBlur={(e) => updateDiet('do', e.target.innerText)}
                  className="p-3 text-[11px] text-gray-700 min-h-[80px] outline-none whitespace-pre-line"
                >
                  {diet.do}
                </div>
              </div>
            </div>

          {/* Golden Rule Strip */}
          <div className="bg-[#FDF4E3] border border-[#C9963A44] p-1.5 mb-6 text-center">
            <p className="text-[9px] text-[#C9963A] font-bold uppercase tracking-widest">
              ⚡ POSITIVE Condition → No D1/D2/D3 | NEGATIVE Condition → No D30/D100/D200
            </p>
          </div>

          {/* Footer */}
          <div className="mt-auto flex justify-between items-end border-t border-gray-100 pt-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-[#1A3D1C]">Next Visit:</span>
                <div className="relative group no-print">
                  <select 
                    value={nextVisit}
                    onChange={(e) => setNextVisit(e.target.value)}
                    className="appearance-none bg-transparent border-b border-dashed border-[#C9963A] pr-6 outline-none cursor-pointer"
                  >
                    <option value="7 days">7 days</option>
                    <option value="15 days">15 days</option>
                    <option value="30 days">30 days</option>
                    <option value="45 days">45 days</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-0 top-1 text-[#C9963A] pointer-events-none" />
                </div>
                <span className="hidden print:inline border-b border-dashed border-[#C9963A] min-w-[60px] text-center">
                  {nextVisit}
                </span>
              </div>
              <div className="text-[10px] text-[#1A3D1C] font-bold mt-2">
                दवा बिना.. {doctor?.clinic_city || "Seoni"}
              </div>
            </div>
            <div className="text-center">
              <div className="w-32 border-b border-gray-300 mb-1"></div>
              <div className="text-xs font-bold text-[#1A3D1C]">
                Dr. {doctor?.doctor_name || "________________"}
              </div>
              <div className="text-[9px] text-gray-400 uppercase">Authorized Signature</div>
            </div>
          </div>

        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          #prescription-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
          [contenteditable] {
            border-bottom: none !important;
          }
          input {
            border-bottom: none !important;
          }
        }
        [contenteditable]:hover, [contenteditable]:focus {
          background-color: rgba(201, 150, 58, 0.05);
        }
      `}</style>
    </div>
  );
};

export default EHPrescription_Jagamba;
