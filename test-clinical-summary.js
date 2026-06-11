const { buildClinicalData } = require('./backend/services/ehSourceOfTruthClinical');
const { searchBooks, combineWithRuleEngine } = require('./backend/services/bookSearchEngine');

const testCases = [
  {
    name: "Case 1: Chronic Joint Pain (Lymphatic)",
    input: {
      symptoms: [{ name: "jod dard" }, { name: "sujan" }],
      chief_complaint: "Purana gathiya aur jodon mein sujan",
      bp_systolic: 120,
      bp_diastolic: 80,
      phase: "CHRONIC",
      report_values: { uric_acid: 8.5 }
    }
  },
  {
    name: "Case 2: High BP & Heart Palpitations (Sanguine)",
    input: {
      symptoms: [{ name: "dhadkan" }, { name: "gussa" }],
      chief_complaint: "High BP aur dil ki dhadkan badhna",
      bp_systolic: 165,
      bp_diastolic: 95,
      phase: "ACUTE",
      report_values: { cholesterol: 240 }
    }
  },
  {
    name: "Case 3: Nervousness & Insomnia (Nervous)",
    input: {
      symptoms: [{ name: "neend nahi aana" }, { name: "chakkar" }],
      chief_complaint: "Ghabrahat aur neend ki kami",
      bp_systolic: 115,
      bp_diastolic: 75,
      phase: "CHRONIC",
      report_values: {}
    }
  },
  {
    name: "Case 4: Respiratory Issues & Fever (Mixed/P-Group)",
    input: {
      symptoms: [{ name: "khansi" }, { name: "bukhar" }],
      chief_complaint: "Saans lene mein takleef aur purani khansi",
      bp_systolic: 125,
      bp_diastolic: 82,
      phase: "SUB_ACUTE",
      report_values: { wbc: 12000 }
    }
  }
];

async function runTests() {
  console.log("=== EH AROGYA SUTRA: CLINICAL SUMMARY TEST ===\n");

  for (const test of testCases) {
    console.log(`--- Testing ${test.name} ---`);
    try {
      // 1. Run Clinical Engine
      const clinicalData = buildClinicalData(test.input);
      
      // 2. Run Book Search
      const bookResult = await searchBooks(test.input.symptoms);
      
      // 3. Combine (Mocking ruleResult structure for combineWithRuleEngine)
      const mockRuleResult = {
        confidence: 75,
        formulas: [
          { meds: clinicalData.formulas.formula_a.medicines, format: clinicalData.formulas.formula_a.formatted },
          { meds: clinicalData.formulas.formula_b.medicines, format: clinicalData.formulas.formula_b.formatted },
          { meds: clinicalData.formulas.formula_c.medicines, format: clinicalData.formulas.formula_c.formatted }
        ]
      };
      const combined = combineWithRuleEngine(mockRuleResult, bookResult);

      console.log(`Detected Temperament: ${clinicalData.temperament}`);
      console.log(`Polarity: ${clinicalData.polData.polarity} (${clinicalData.polData.potency})`);
      console.log(`Electricity: ${clinicalData.elecCode}`);
      console.log(`Formula A: ${clinicalData.formulas.formula_a.formatted}`);
      console.log(`Book References Found: ${combined.bookReferences.length}`);
      if (combined.bookReferences.length > 0) {
        console.log(`Top Book Ref: ${combined.bookReferences[0].citation}`);
      }
      console.log(`Final Confidence: ${combined.confidence}%`);
      console.log("\n");
    } catch (err) {
      console.error(`Error in ${test.name}:`, err.message);
    }
  }
}

runTests();
