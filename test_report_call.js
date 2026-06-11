const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testReportAPI() {
    const payload = {
        patient_name: "Test Report Patient",
        age: 45,
        gender: "Male",
        bp_systolic: 155,
        bp_diastolic: 95,
        symptoms: "swelling, high bp",
        condition: "chronic",
        report_text: "Patient has high creatinine 1.8 and uric acid 8.5. SGPT is 65."
    };

    try {
        console.log("Calling Analyze Report API...");
        const response = await fetch('http://localhost:8000/api/v3/analyze-report', {
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
            console.log("Response Keys:", Object.keys(data));
            if (data.mixtures) console.log("Mixtures count:", data.mixtures.length);
            if (data.summary) console.log("Summary length:", data.summary.length);
            if (data.clinical_summary) console.log("Clinical Summary length:", data.clinical_summary.length);
        } else {
            console.log("❌ Failed with status:", status);
            console.log("Error details:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("❌ Network Error:", error.message);
    }
}

testReportAPI();
