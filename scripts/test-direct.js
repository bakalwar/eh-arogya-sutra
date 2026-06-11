const axios = require('axios');

async function testDirect() {
    console.log("Testing FastAPI Direct...");
    try {
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
            headers: { 'X-API-KEY': 'EH_TEST_KEY_2026' }
        });

        console.log("Full Response Keys:", Object.keys(res.data));
        console.log("Active Systems:", res.data.active_systems);
        console.log("Mixtures:", res.data.mixtures.map(m => `${m.system}: ${m.formula}`));
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
testDirect();
