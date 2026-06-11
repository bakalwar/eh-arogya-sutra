const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
    const payload = {
        patient_name: "Test Patient",
        age: 45,
        gender: "Male",
        bp_systolic: 155,
        bp_diastolic: 95,
        symptoms: "swelling in hands feet, high BP, back pain",
        condition: "chronic",
        disease_names: ["Hypertension / High BP"]
    };

    try {
        console.log("Calling EH API...");
        const response = await fetch('http://localhost:8000/api/v3/prescribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'EH_TEST_KEY_2026'
            },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        const data = await response.json();

        if (status === 200) {
            console.log("✅ Success!");
            console.log("Mixtures count:", data.mixtures.length);
            console.log("First Mixture Formula:", data.mixtures[0].formula);
            console.log("Clinical Summary length:", data.clinical_summary.length);
        } else {
            console.log("❌ Failed with status:", status);
            console.log("Error details:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("❌ Network Error:", error.message);
    }
}

testAPI();
