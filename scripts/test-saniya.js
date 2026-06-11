const axios = require('axios');

async function testSaniya() {
    console.log("Testing Saniya Case: shine me dard hai esatan me ganth hai dard bhi hota hai");
    try {
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'admin',
            password: 'password123'
        });
        const token = login.data.token;

        const res = await axios.post('http://localhost:8000/api/v3/prescribe', {
            patient_name: "Saniya",
            age: 28,
            gender: "Female",
            bp_systolic: 120,
            bp_diastolic: 80,
            symptoms: "shine me dard hai esatan me ganth hai dard bhi hota hai",
            condition: "chronic",
            disease_names: []
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("\n--- TEST RESULTS ---");
        console.log("Detected Systems:", res.data.active_systems);
        console.log("Prakriti:", res.data.prakriti);
        console.log("Polarity:", res.data.polarity);
        console.log("\nMixtures:");
        res.data.mixtures.forEach(m => {
            console.log(`${m.label} (${m.system}): ${m.formula}`);
        });

        console.log("\n--- CLINICAL SUMMARY EXCERPT ---");
        const summary = res.data.clinical_summary;
        // console.log(summary);
        
        const rcaMatch = summary.match(/ROOT CAUSE ANALYSIS[\s\S]*?STAGE 2/);
        if (rcaMatch) console.log("\nRCA:\n", rcaMatch[0]);

        const stage3Match = summary.match(/STAGE 3[\s\S]*?STAGE 4/);
        if (stage3Match) console.log("\nSTAGE 3 (Tablets):\n", stage3Match[0]);

        const stage4Match = summary.match(/STAGE 4[\s\S]*?STAGE 5/);
        if (stage4Match) console.log("\nSTAGE 4 (Oil):\n", stage4Match[0]);

    } catch (err) {
        if (err.response) {
            console.error("Error Response:", err.response.status, err.response.data);
        } else {
            console.error("Error Message:", err.message);
        }
    }
}

testSaniya();
