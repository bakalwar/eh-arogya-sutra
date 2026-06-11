"""
REPORT OCR — EH Arogya Sutra
Medical report photo → Structured text extraction
Technologies: PaddleOCR → EasyOCR → Tesseract (fallback chain)
"""
import re
import os
import json
from pathlib import Path

# ═══════════════════════════════════════════════════════
# OCR EXTRACTION — 3-Level Fallback Chain
# ═══════════════════════════════════════════════════════

def extract_text_from_image(image_path: str) -> dict:
    """
    Image se text extract karo.
    PaddleOCR → EasyOCR → Tesseract (fallback)
    Returns: {text, method, confidence}
    """
    text   = ""
    method = "none"

    # LEVEL 1: PaddleOCR (Best — tables + layouts)
    try:
        from paddleocr import PaddleOCR
        ocr    = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        result = ocr.ocr(image_path, cls=True)
        lines  = []
        for res in result:
            if res:
                for line in res:
                    if line and len(line) >= 2:
                        lines.append(line[1][0])
        text   = "\n".join(lines)
        method = "PaddleOCR"
    except Exception as e1:
        # LEVEL 2: EasyOCR (Good fallback)
        try:
            import easyocr
            reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            result = reader.readtext(image_path)
            text   = "\n".join([r[1] for r in result])
            method = "EasyOCR"
        except Exception as e2:
            # LEVEL 3: Tesseract (Basic fallback)
            try:
                import pytesseract
                from PIL import Image
                img    = Image.open(image_path)
                text   = pytesseract.image_to_string(img, config='--psm 6')
                method = "Tesseract"
            except Exception as e3:
                return {
                    "text": "",
                    "method": "FAILED",
                    "error": f"All OCR failed: {e3}"
                }

    return {
        "text":      text,
        "method":    method,
        "char_count": len(text)
    }


# ═══════════════════════════════════════════════════════
# REPORT TYPE DETECTION
# ═══════════════════════════════════════════════════════
REPORT_TYPE_KEYWORDS = {
    "BLOOD_TEST":   ["haemoglobin","hemoglobin","wbc","tlc","platelet",
                     "hematocrit","rbc","mcv","mch","mchc","rdw",
                     "neutrophil","lymphocyte","eosinophil","basophil",
                     "blood count","cbc","hb","differential"],
    "KFT":          ["creatinine","bun","urea","uric acid","gfr",
                     "kidney function","renal function","kft","sodium",
                     "potassium","chloride","bicarbonate","egfr"],
    "LFT":          ["sgpt","sgot","alt","ast","bilirubin","albumin",
                     "globulin","alk phos","alp","ggt","protein total",
                     "liver function","lft","jaundice"],
    "LIPID":        ["cholesterol","ldl","hdl","triglyceride","vldl",
                     "lipid profile","non-hdl"],
    "DIABETES":     ["fasting sugar","random sugar","glucose","hba1c",
                     "glycated","pp sugar","post prandial","ogtt"],
    "THYROID":      ["tsh","t3","t4","thyroid","ft3","ft4","t3 total"],
    "VITAMIN":      ["vitamin d","vitamin b12","b12","folate","folic acid",
                     "ferritin","iron","tibc","transferrin"],
    "SONOGRAPHY":   ["sonography","ultrasonography","usg","ultrasound",
                     "liver","spleen","gallbladder","pancreas","kidney",
                     "uterus","ovary","urinary bladder","prostate",
                     "echogenicity","echogenic","echotexture"],
    "XRAY":         ["x-ray","xray","radiograph","chest pa","chest ap",
                     "bones","lung fields","cardiac shadow","pleural",
                     "diaphragm","trachea","rib"],
    "MRI":          ["mri","magnetic resonance","disc","herniation",
                     "nerve root","spinal cord","vertebra","foramen",
                     "stenosis","signal intensity","t1","t2 weighted"],
    "CT_SCAN":      ["ct scan","computed tomography","hounsfield",
                     "contrast","axial","coronal","sagittal","ct chest",
                     "ct abdomen","ct brain"],
    "ECG":          ["ecg","electrocardiogram","sinus rhythm","heart rate",
                     "st segment","pr interval","qrs","qt interval",
                     "axis","arrhythmia"],
}

def detect_report_type(text: str) -> str:
    text_lower = text.lower()
    scores     = {rtype: 0 for rtype in REPORT_TYPE_KEYWORDS}
    for rtype, kws in REPORT_TYPE_KEYWORDS.items():
        for kw in kws:
            if kw in text_lower:
                scores[rtype] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "GENERAL"


# ═══════════════════════════════════════════════════════
# VALUE EXTRACTION — Regex Patterns
# ═══════════════════════════════════════════════════════
LAB_PATTERNS = {
    # Blood Test
    "hemoglobin":    r"h(?:ae?)?mo(?:globin)?[:\s]*(\d+\.?\d*)",
    "hematocrit":    r"h(?:ae?)?matocrits?[:\s]*(\d+\.?\d*)",
    "rbc":           r"r\.?b\.?c\.?[:\s]*(\d+\.?\d*)",
    "wbc":           r"(?:w\.?b\.?c|tlc|total leucocyte)[:\s]*(\d+\.?\d*)",
    "platelet":      r"platelet[:\s]*(\d+\.?\d*)",
    "mcv":           r"m\.?c\.?v\.?[:\s]*(\d+\.?\d*)",
    "mch":           r"m\.?c\.?h(?!\s*c)[:\s]*(\d+\.?\d*)",
    "mchc":          r"m\.?c\.?h\.?c\.?[:\s]*(\d+\.?\d*)",
    "rdw":           r"r\.?d\.?w\.?[:\s]*(\d+\.?\d*)",
    "neutrophils":   r"neutrophils?[:\s]*(\d+\.?\d*)",
    "lymphocytes":   r"lymphocytes?[:\s]*(\d+\.?\d*)",
    "monocytes":     r"monocytes?[:\s]*(\d+\.?\d*)",
    "eosinophils":   r"eosinophils?[:\s]*(\d+\.?\d*)",
    "esr":           r"e\.?s\.?r\.?[:\s]*(\d+\.?\d*)",

    # KFT
    "creatinine":    r"creatinine[:\s]*(\d+\.?\d*)",
    "uric_acid":     r"uric\s*acid[:\s]*(\d+\.?\d*)",
    "urea":          r"(?:urea|bun)[:\s]*(\d+\.?\d*)",
    "sodium":        r"sodium[:\s]*(\d+\.?\d*)",
    "potassium":     r"potassium[:\s]*(\d+\.?\d*)",
    "gfr":           r"(?:egfr|gfr)[:\s]*(\d+\.?\d*)",

    # LFT
    "sgpt":          r"(?:sgpt|alt)[:\s]*(\d+\.?\d*)",
    "sgot":          r"(?:sgot|ast)[:\s]*(\d+\.?\d*)",
    "bilirubin":     r"bilirubin\s*(?:total)?[:\s]*(\d+\.?\d*)",
    "albumin":       r"albumin[:\s]*(\d+\.?\d*)",
    "alp":           r"(?:alp|alk\s*phos)[:\s]*(\d+\.?\d*)",
    "ggt":           r"(?:ggt|gamma\s*gt)[:\s]*(\d+\.?\d*)",
    "total_protein": r"total\s*protein[:\s]*(\d+\.?\d*)",

    # Lipid
    "cholesterol":   r"(?:total\s*)?cholesterol[:\s]*(\d+\.?\d*)",
    "ldl":           r"l\.?d\.?l\.?[:\s]*(\d+\.?\d*)",
    "hdl":           r"h\.?d\.?l\.?[:\s]*(\d+\.?\d*)",
    "triglycerides": r"triglyceride[s]?[:\s]*(\d+\.?\d*)",

    # Diabetes
    "sugar_fasting": r"(?:fasting\s*(?:sugar|glucose)|glucose\s*fasting)[:\s]*(\d+\.?\d*)",
    "sugar_pp":      r"(?:pp|post\s*prandial|random)\s*(?:sugar|glucose)[:\s]*(\d+\.?\d*)",
    "hba1c":         r"hba1c[:\s]*(\d+\.?\d*)",

    # Thyroid
    "tsh":           r"t\.?s\.?h\.?[:\s]*(\d+\.?\d*)",
    "t3":            r"\bt3\b[:\s]*(\d+\.?\d*)",
    "t4":            r"\bt4\b[:\s]*(\d+\.?\d*)",

    # Vitamins
    "vitamin_d":     r"vitamin\s*d[:\s]*(\d+\.?\d*)",
    "vitamin_b12":   r"(?:vitamin\s*b12|b12|cobalamin)[:\s]*(\d+\.?\d*)",
    "ferritin":      r"ferritin[:\s]*(\d+\.?\d*)",
    "iron":          r"\biron\b[:\s]*(\d+\.?\d*)",

    # BP (if in report)
    "bp_systolic":   r"(?:systolic|sbp)[:\s]*(\d+)",
    "bp_diastolic":  r"(?:diastolic|dbp)[:\s]*(\d+)",
}

def extract_lab_values(text: str) -> dict:
    """Text se numeric lab values nikalo."""
    text_lower = text.lower()
    values     = {}
    for param, pattern in LAB_PATTERNS.items():
        match = re.search(pattern, text_lower)
        if match:
            try:
                values[param] = float(match.group(1))
            except:
                pass
    return values


# ═══════════════════════════════════════════════════════
# SONOGRAPHY / MRI / X-RAY TEXT FINDINGS EXTRACTION
# ═══════════════════════════════════════════════════════
FINDING_PATTERNS = {
    # Liver
    "fatty_liver":      ["fatty liver","fatty change","hepatic steatosis",
                         "grade i fatty","grade ii fatty","grade iii fatty",
                         "echogenic liver","bright liver"],
    "liver_enlarged":   ["liver enlarged","hepatomegaly","liver size increased",
                         "enlarged liver","liver: mildly enlarged"],
    "cirrhosis":        ["cirrhosis","cirrhotic","coarse echotexture liver"],
    "liver_lesion":     ["liver lesion","hepatic lesion","focal lesion liver",
                         "liver mass","hepatic mass"],
    "gallstones":       ["gallstone","cholelithiasis","calculus gallbladder",
                         "echogenic foci gallbladder","multiple stones",
                         "stone in gallbladder","calculi"],

    # Kidney
    "kidney_stone":     ["renal calculus","kidney stone","calculus kidney",
                         "nephrolithiasis","stone in kidney","renal stone",
                         "calculi kidney","pelvicalyceal"],
    "hydronephrosis":   ["hydronephrosis","pcs dilated","pelviectasis",
                         "dilated collecting","renal pelvis"],
    "kidney_cyst":      ["renal cyst","kidney cyst","simple cyst kidney"],

    # Uterus/Ovary
    "fibroid":          ["fibroid","myoma","leiomyoma","fibromyoma",
                         "uterine fibroid","uterus fibroid"],
    "ovarian_cyst":     ["ovarian_cyst","cyst ovary","follicular cyst",
                         "corpus luteum cyst","pcod","pcos",
                         "multiple follicles","polycystic ovary"],
    "bulky_uterus":     ["bulky uterus","enlarged uterus","uterus bulky",
                         "uterus mildly bulky"],

    # Spine/Disc (MRI/X-Ray)
    "disc_herniation":  ["disc herniation","disc herniated","disc prolapse",
                         "herniated disc","disc protrusion","disc extrusion"],
    "disc_bulge":       ["disc bulge","bulging disc","disc desiccation",
                         "disc space reduced"],
    "nerve_compression":["nerve compression","nerve root compression",
                         "radiculopathy","foraminal stenosis","cord compression"],
    "bone_spur":        ["bone spur","osteophyte","osteophytic","spur",
                         "calcaneal spur","heel spur","marginal osteophyte"],
    "spondylosis":      ["spondylosis","spondylotic","degenerative change",
                         "facet arthropathy","ligamentum flavum"],

    # Chest (X-Ray/CT)
    "cardiomegaly":     ["cardiomegaly","cardiac shadow enlarged","ctr increased",
                         "enlarged heart"],
    "pleural_effusion": ["pleural effusion","pleural fluid","blunting costophrenic",
                         "costophrenic angle"],
    "pneumonia":        ["pneumonia","consolidation","air space opacity",
                         "infiltrate","lobar pneumonia"],

    # Prostate
    "prostate_enlarged":["prostate enlarged","bph","benign prostatic",
                         "prostate volume increased","enlarged prostate"],
}

def extract_text_findings(text: str) -> list:
    """Sonography/MRI/X-Ray text se clinical findings nikalo."""
    text_lower = text.lower()
    findings   = []
    for finding_key, keywords in FINDING_PATTERNS.items():
        for kw in keywords:
            if kw in text_lower:
                findings.append(finding_key)
                break
    return findings


# ═══════════════════════════════════════════════════════
# MAIN PROCESS FUNCTION
# ═══════════════════════════════════════════════════════
def process_report_image(image_path: str) -> dict:
    """
    Complete pipeline:
    Image → OCR → Report Type → Values + Findings
    """
    # Step 1: Extract text
    ocr_result = extract_text_from_image(image_path)
    if not ocr_result.get("text"):
        return {
            "success":     False,
            "error":       "Could not extract text from image",
            "ocr_method":  ocr_result.get("method","FAILED")
        }

    text        = ocr_result["text"]
    report_type = detect_report_type(text)
    lab_values  = extract_lab_values(text)
    findings    = extract_text_findings(text)

    return {
        "success":     True,
        "ocr_method":  ocr_result["method"],
        "report_type": report_type,
        "lab_values":  lab_values,
        "findings":    findings,
        "raw_text":    text[:500]  # First 500 chars for debug
    }


if __name__ == "__main__":
    # Test karo agar image path do
    import sys
    if len(sys.argv) > 1:
        result = process_report_image(sys.argv[1])
        print(json.dumps(result, indent=2))
    else:
        print("Usage: python3 report_ocr.py <image_path>")
        print("Example: python3 report_ocr.py blood_test.jpg")
