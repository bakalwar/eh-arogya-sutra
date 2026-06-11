const axios = require('axios');

const API_URL = 'http://localhost:8000/api/v3/prescribe';
const API_KEY = 'EH_TEST_KEY_2026';

const cases = [
    {
        name: "Patient 1 - Throat Cancer",
        age: 55,
        gender: "Male",
        bp_systolic: 130,
        bp_diastolic: 85,
        symptoms: "throat cancer, difficulty swallowing, pain in throat, swelling in neck glands",
        condition: "chronic"
    },
    {
        name: "Patient 2 - Appendicitis",
        age: 28,
        gender: "Female",
        bp_systolic: 110,
        bp_diastolic: 70,
        symptoms: "appendicitis, sharp pain in lower right abdomen, nausea, feverish feeling",
        condition: "acute"
    },
    {
        name: "Patient 3 - Urinary Tract Lump",
        age: 42,
        gender: "Male",
        bp_systolic: 125,
        bp_diastolic: 80,
        symptoms: "urine nali me ganth, urinary tract lump, pain during urination, frequent urge",
        condition: "chronic"
    },
    {
        name: "Patient 4 - Hernia",
        age: 50,
        gender: "Male",
        bp_systolic: 135,
        bp_diastolic: 88,
        symptoms: "hernia, bulge in groin area, pain when lifting, heavy feeling in abdomen",
        condition: "chronic"
    },
    {
        name: "Patient 5 - Piles",
        age: 36,
        gender: "Female",
        bp_systolic: 115,
        bp_diastolic: 75,
        symptoms: "piles, bawasir, rectal bleeding, pain during stool, constipation",
        condition: "chronic"
    }
];

async function runTests() {
    console.log("🚀 Starting 5-Case Clinical Validation...\n");

    for (const c of cases) {
        try {
            console.log(`--------------------------------------------------`);
            console.log(`TESTING: ${c.name}`);
            console.log(`SYMPTOMS: ${c.symptoms}`);
            
            const res = await axios.post(API_URL, c, {
                headers: { 'x-api-key': API_KEY }
            });

            const data = res.data;
            if (data.status === 'success') {
                console.log(`✅ SUCCESS: API Responded`);
                console.log(`POLARITY: ${data.clinical_analysis.polarity} | POTENCY: ${data.clinical_analysis.potency}`);
                console.log(`SYSTEMS: ${data.clinical_analysis.active_systems.join(', ')}`);
                
                console.log(`\nMIXTURES:`);
                const usedMeds = new Set();
                let duplicates = false;
                
                data.mixtures.forEach(m => {
                    console.log(`  ${m.label} (${m.system}): ${m.formula}`);
                    const meds = m.formula.split('—')[0].split('+').map(x => x.trim());
                    meds.forEach(med => {
                        if (usedMeds.has(med)) {
                            console.log(`  ❌ DUPLICATE FOUND: ${med}`);
                            duplicates = true;
                        }
                        usedMeds.add(med);
                    });
                });

                if (!duplicates) console.log(`  ✨ All medicines are unique across A, B, C.`);

                // Check for summary
                if (data.clinical_summary && data.clinical_summary.includes('EH AROGYA SUTRA')) {
                    console.log(`✅ SUMMARY: Generated (ASCII Boxes present)`);
                    
                    // Extract Oil Formula from summary - more robust search
                    const lines = data.clinical_summary.split('\n');
                    let oilFormula = 'Not found';
                    let foundSection = false;
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].includes('OIL FORMULA')) foundSection = true;
                        if (foundSection && lines[i].includes('Formula')) {
                            oilFormula = lines[i].split(':')[1].trim();
                            break;
                        }
                    }
                    console.log(`✅ OIL FORMULA: ${oilFormula}`);
                } else {
                    console.log(`❌ SUMMARY: Missing or invalid format`);
                }

            } else {
                console.log(`❌ FAILED: ${data.message}`);
            }
        } catch (err) {
            console.log(`❌ ERROR: ${err.message}`);
            if (err.response) console.log(`   Data: ${JSON.stringify(err.response.data)}`);
        }
        console.log(`\n`);
    }
}

runTests();
