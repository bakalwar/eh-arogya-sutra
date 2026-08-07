import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLINICAL_PRODUCT_CONSTITUTION } from '../../packages/clinical-contracts/src/constitution.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const constitutionPath = path.join(root, 'docs/clinical/CLINICAL_PRODUCT_CONSTITUTION.md');

describe('Phase 3A clinical product constitution guard', () => {
  it('retains permanent clinical requirements', () => {
    const text = fs.readFileSync(constitutionPath, 'utf8');
    expect(text).toMatch(/100,000 registered doctors/i);
    expect(text).toMatch(/nine-rule engine/i);
    expect(text).toMatch(/evidence/i);
    expect(text).toMatch(/confidence/i);
    expect(text).toMatch(/Simple → \*\*3\*\*/);
    expect(text).toMatch(/Moderate → \*\*4\*\*/);
    expect(text).toMatch(/Complex\/multi-system → \*\*5\*\*/);
    expect(text).toMatch(/no fixed medicine\/formula/i);
    expect(text).toMatch(/no default WE/i);
    expect(text).toMatch(/full \*\*38\*\*-medicine pool/i);
    expect(text).toMatch(/organ\/body-site specific/i);
    expect(text).toMatch(/patient-specific summary/i);
    expect(text).toMatch(/No original photo\/PDF may be stored permanently/i);
    expect(text).toMatch(/Doctor review/i);
    expect(text).toMatch(/Modification creates a new version/i);
    expect(text).toMatch(/immutable/i);

    expect(CLINICAL_PRODUCT_CONSTITUTION.scale.targetRegisteredDoctors).toBe(100_000);
    expect(CLINICAL_PRODUCT_CONSTITUTION.engine.nineRuleEngineRequired).toBe(true);
    expect(CLINICAL_PRODUCT_CONSTITUTION.oralFormulas.simpleCount).toBe(3);
    expect(CLINICAL_PRODUCT_CONSTITUTION.oralFormulas.moderateCount).toBe(4);
    expect(CLINICAL_PRODUCT_CONSTITUTION.oralFormulas.complexCount).toBe(5);
    expect(CLINICAL_PRODUCT_CONSTITUTION.oralFormulas.noDefaultWE).toBe(true);
    expect(CLINICAL_PRODUCT_CONSTITUTION.tablets.fullMedicinePoolSize).toBe(38);
    expect(CLINICAL_PRODUCT_CONSTITUTION.generation.noFixedMedicineOrFormula).toBe(true);
    expect(CLINICAL_PRODUCT_CONSTITUTION.review.doctorReviewBeforeIssuance).toBe(true);
    expect(CLINICAL_PRODUCT_CONSTITUTION.nonRetention.originalPhotoPdfNeverPermanent).toBe(true);
  });
});
