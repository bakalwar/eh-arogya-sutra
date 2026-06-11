const axios = require('axios');

async function testSonali() {
    const url = 'http://localhost:8000/api/v3/prescribe';
    
    const payload = {
        patient_name: "Sonali",
        age: 22,
        gender: "Female",
        bp_systolic: 115,
        bp_diastolic: 70,
        symptoms: "sardi, jukham, bukhar aur gale me dard",
        condition: "acute",
        disease_names: []
    };

    try {
        console.log("--- TESTING CASE: Sonali (Cold/Cough/Fever/Throat Pain) ---");
        const res = await axios.post(url, payload, { headers: { 'x-api-key': 'EH_TEST_KEY_2026' } });
        
        console.log(`Polarity: ${res.data.clinical_analysis.polarity}`);
        console.log(`Active Systems: ${res.data.clinical_analysis.active_systems.join(", ")}`);
        
        const summary = res.data.clinical_summary;
        console.log("\n--- ROOT CAUSE ANALYSIS ---");
        const rcaMatch = summary.match(/ROOT CAUSE ANALYSIS.*?─+([\s\S]*?)STAGE 2/s);
        console.log(rcaMatch ? rcaMatch[1].trim() : "RCA Section not found");

        console.log("\n--- STAGE 3 (TABLETS) ---");
        const tabletMatch = summary.match(/STAGE 3.*?─+([\s\S]*?)STAGE 4/s);
        console.log(tabletMatch ? tabletMatch[1].trim() : "Tablet Section not found");

        console.log("\n--- VERIFICATION ---");
        const hasCardiac = summary.includes("Cardiovascular System Pathology");
        console.log(`Cardiac RCA Included: ${hasCardiac ? "❌ FAILED (Should be excluded for normal BP)" : "✅ PASSED (Excluded)"}`);
        
        const hasRespiratory = summary.includes("Respiratory & Immune Pathology");
        console.log(`Respiratory RCA Included: ${hasRespiratory ? "✅ PASSED" : "❌ FAILED"}`);

        const hasS1Tablet = summary.includes("After Food  : S1 — Post-meal anti-inflammatory support");
        console.log(`S1 Anti-inflammatory Tablet: ${hasS1Tablet ? "✅ PASSED" : "❌ FAILED"}`);

    } catch (error) {
        console.error("Error during test:", error.response ? error.response.data : error.message);
    }
}

testSonali();
