const axios = require('axios');

async function testComplexCase() {
    console.log("Testing Complex Case: pait me dard, constipation aur urine nali me ganth");
    try {
        const res = await axios.post('http://localhost:8000/api/v3/prescribe', {
            patient_name: "Test Patient",
            age: 45,
            gender: "Male",
            bp_systolic: 130,
            bp_diastolic: 85,
            symptoms: "pait me dard, constipation aur urine nali me ganth",
            condition: "chronic",
            disease_names: []
        }, {
            headers: { 'X-API-KEY': 'EH_TEST_KEY_2026' }
        });

        console.log("\n--- CLINICAL ENGINE RESULTS ---");
        console.log("Detected Systems:", res.data.clinical_analysis.active_systems);
        console.log("Prakriti:", res.data.clinical_analysis.prakriti);
        console.log("Polarity:", res.data.clinical_analysis.polarity);
        
        console.log("\n--- GENERATED MIXTURES ---");
        res.data.mixtures.forEach(m => {
            console.log(`${m.label} (${m.system}): ${m.formula}`);
        });

        console.log("\n--- CLINICAL SUMMARY (VERIFICATION) ---");
        const summary = res.data.clinical_summary;
        
        // Check for 9 Rule Engine Verification section
        if (summary.includes("9 EH RULE ENGINE VERIFICATION")) {
            console.log("✅ 9 Rule Engine Verification section present.");
        } else {
            console.log("❌ 9 Rule Engine Verification section MISSING.");
        }

        // Check for specific system patholgies in RCA
        if (summary.includes("Gastrointestinal System Pathology")) console.log("✅ Gastric Pathology present in RCA.");
        if (summary.includes("Urinary Tract Pathology")) console.log("✅ Urinary Tract Pathology present in RCA.");
        
        // Check for English only
        const hindiMatch = summary.match(/[\u0900-\u097F]/);
        if (hindiMatch) {
            console.log("❌ Hindi characters detected in summary!");
        } else {
            console.log("✅ Summary is 100% English.");
        }

        console.log("\n--- FULL SUMMARY PREVIEW ---");
        console.log(summary.substring(0, 1500) + "...");

    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}

testComplexCase();
