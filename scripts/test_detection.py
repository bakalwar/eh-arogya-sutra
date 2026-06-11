import re
from typing import List

SYMPTOM_MAP = {
    'ganth': 'GLANDULAR',
    'urine': 'RENAL',
    'peshab': 'RENAL',
    'nali': 'RENAL' # Temporary for testing
}

def detect_active_systems(symptoms: str, bp_sys: int) -> List[str]:
    active_systems = []
    symptoms_lower = symptoms.lower()

    if any(term in symptoms_lower for term in ['ganth', 'galthi', 'lump', 'tumor', 'cancer', 'stan', 'breast', 'esatan', 'lymph', 'gland', 'rasoli', 'goli']):
        active_systems.append('GLANDULAR')
    
    if any(term in symptoms_lower for term in ['heart', 'bp', 'blood pressure', 'palpitation', 'chest pain', 'dhakan', 'seena', 'shine', 'chhathi', 'chest', 'dil']):
        active_systems.append('CARDIAC')
        
    if any(term in symptoms_lower for term in ['pet', 'stomach', 'gas', 'acid', 'digest', 'pachan', 'bhukh', 'appetite', 'bloating', 'afara']):
        active_systems.append('GASTRIC')

    if any(term in symptoms_lower for term in ['pet saf', 'constipation', 'kabj', 'kabz', 'stomach clear', 'hard stool', 'latrine', 'pakhana']):
        active_systems.append('CONSTIPATION')

    if any(term in symptoms_lower for term in ['liver', 'jaundice', 'piliya', 'pitta', 'pitt', 'bile', 'fatty liver']):
        active_systems.append('LIVER')

    if any(term in symptoms_lower for term in ['joint', 'arthritis', 'ghutno', 'knee', 'gardan', 'neck', 'shoulder', 'cervical', 'spine', 'stiff', 'gathiya', 'joro']):
        active_systems.append('JOINTS')

    if any(term in symptoms_lower for term in ['back pain', 'kamar', 'sciatica', 'nerve', 'nas', 'headache', 'sir dard', 'dizziness', 'chakkar', 'mirgi']):
        active_systems.append('NEURO')

    if any(term in symptoms_lower for term in ['kidney', 'urine', 'creatinine', 'uric acid', 'swelling', 'sujan', 'stone', 'pathri', 'peshab', 'gurda', 'mutr', 'mutra', 'pishab', 'pichab', 'nali']):
        if 'nali' in symptoms_lower:
            if any(u in symptoms_lower for u in ['urine', 'mutr', 'mutra', 'peshab', 'pishab', 'pichab']):
                active_systems.append('RENAL')
            elif any(l in symptoms_lower for l in ['pitt', 'pitta', 'liver', 'jaundice']):
                if 'LIVER' not in active_systems: active_systems.append('LIVER')
        else:
            active_systems.append('RENAL')

    if any(term in symptoms_lower for term in ['weakness', 'kamzori', 'fatigue', 'thakan', 'diabetes', 'sugar', 'jhun jhuni', 'tingling', 'numb', 'suun']):
        active_systems.append('METABOLIC')

    active_systems = list(dict.fromkeys(active_systems))[:4]
    if not active_systems:
        active_systems = ["METABOLIC"]
    return active_systems

test_symptoms = "urine nali me ganth"
print(f"Symptoms: {test_symptoms}")
print(f"Detected Systems: {detect_active_systems(test_symptoms, 120)}")
