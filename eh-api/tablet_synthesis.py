"""
Mixture D (Globules / Tablet) — dynamic synthesis per primary disease system.
Liquid mixtures A/B/C remain in clinical_engines.build_formula_dynamic (unchanged).
"""
from typing import List, Dict, Set, Optional


def _norm_system(system: str) -> str:
    """Map 9-engine system keys to Mattei CDSS organ keys."""
    s = (system or "").strip().upper()
    aliases = {
        "GASTRIC": "DIGESTIVE",
        "LIVER": "DIGESTIVE",
        "METABOLIC": "DIGESTIVE",
        "RESPIRATORY": "DIGESTIVE",
        "FEVER": "DIGESTIVE",
        "PARASITIC": "DIGESTIVE",
        "CONSTIPATION": "DIGESTIVE",
        "GLANDULAR": "GYNE",
        "JOINTS": "NEURO",
    }
    return aliases.get(s, s)


class ElectroHomeopathicCDSS:
    """
    Tablet / Globules (Mixture D) synthesis — Count Mattei rules.
    S + C + F + L/Ven + Electricity derived from temperament + primary system + vitals.
    """

    @staticmethod
    def get_constitutional_base(temperament: str, system: str) -> str:
        temp = (temperament or "Mixed").strip().title()
        sys = _norm_system(system)

        if temp == "Lymphatic":
            if sys == "NEURO":
                return "S1"
            if sys == "GYNE":
                return "S5"
            if sys == "CARDIAC":
                return "S2"
            if sys == "DIGESTIVE":
                return "S10"
            if sys == "SKIN":
                return "S3"
            return "S1"
        if temp == "Sanguine":
            if sys == "NEURO":
                return "A1"
            if sys == "GYNE":
                return "A3"
            if sys == "CARDIAC":
                return "A2"
            if sys == "DIGESTIVE":
                return "A1"
            return "A1"
        # Mixed / Bilious / Nervous / dual
        if sys == "NEURO":
            return "S1 + A1"
        if sys == "GYNE":
            return "S5 + A3"
        if sys == "CARDIAC":
            return "S2 + A2"
        return "S1 + A1"

    @staticmethod
    def get_tissue_remedy(system: str) -> str:
        sys = _norm_system(system)
        mapping = {
            "NEURO": "C1",
            "GYNE": "C4",
            "CARDIAC": "C13",
            "DIGESTIVE": "C10",
            "SKIN": "C3",
            "RENAL": "C6",
            "LIVER": "C5",
        }
        return mapping.get(sys, "C1")

    @staticmethod
    def get_functional_remedy(system: str) -> str:
        sys = _norm_system(system)
        if sys in ("NEURO", "CARDIAC"):
            return "F2"
        return "F1"

    @staticmethod
    def get_drainage_remedy(system: str) -> str:
        sys = _norm_system(system)
        if sys == "NEURO":
            return "L1"
        if sys == "GYNE":
            return "Ven1"
        if sys == "CARDIAC":
            return ""
        if sys == "SKIN":
            return "L1"
        if sys == "RENAL":
            return "L1"
        return "L1"

    @staticmethod
    def get_dynamic_electricity(system: str, systolic: int, diastolic: int) -> str:
        sys = _norm_system(system)
        is_hypoactive = systolic < 100 or diastolic < 60
        if sys == "NEURO":
            return "WE"
        if sys == "GYNE":
            return "RE" if is_hypoactive else "YE"
        if sys == "CARDIAC":
            return "BE"
        if is_hypoactive:
            return "RE"
        return "WE"

    @classmethod
    def synthesize_tablet(
        cls,
        temperament: str,
        primary_system: str,
        systolic_bp: int,
        diastolic_bp: int,
        tablet_dilution: str = "D5",
    ) -> Dict:
        """
        Mixture D — rogi ke pratham (primary) rog-system ke anusar tablet formula.
        Three tiers: Before Food (constitutional), After Food (tissue), Night (drainage/elec).
        """
        sys_key = _norm_system(primary_system or "METABOLIC")

        t_base = cls.get_constitutional_base(temperament, sys_key)
        t_tissue = cls.get_tissue_remedy(sys_key)
        t_drainage = cls.get_drainage_remedy(sys_key)
        t_elec = cls.get_dynamic_electricity(sys_key, systolic_bp, diastolic_bp)

        const_first = t_base.split(" + ")[0].strip()

        tablet_components: List[str] = [const_first, t_tissue]
        if t_drainage:
            tablet_components.append(t_drainage)
        tablet_components.append(t_elec)
        tablet_remedies = sorted(set(tablet_components), key=tablet_components.index)

        is_hypoactive = systolic_bp < 100 or diastolic_bp < 60
        tissue_desc = {
            "NEURO": "Post-meal tissue support for nerve root repair and myelination.",
            "GYNE": "Post-meal pelvic mucosal and glandular tissue regulation.",
            "CARDIAC": "Post-meal vascular wall and cardiac fiber support.",
            "DIGESTIVE": "Post-meal gastro-intestinal mucosal lining support.",
            "SKIN": "Post-meal dermal cell regeneration support.",
            "RENAL": "Post-meal renal interstitial and filtration tissue support.",
        }.get(sys_key, "Post-meal tissue/pathological anti-inflammatory support.")

        night_med = t_drainage if t_drainage else t_elec
        night_desc = {
            "NEURO": "Targeted somatic nerve pathway and lymphatic drainage support.",
            "GYNE": "Targeted reproductive mucosal drainage and hormonal balance.",
            "CARDIAC": "Targeted vascular toning via electro-homeopathic regulation.",
            "DIGESTIVE": "Targeted nocturnal digestive enzyme and mucosal recovery.",
            "RENAL": "Targeted renal lymphatic drainage during rest.",
            "SKIN": "Targeted dermal lymphatic clearing overnight.",
        }.get(sys_key, f"Targeted support for {sys_key.title()} pathology.")

        three_tier = {
            "before_food": {
                "medicine": const_first,
                "label": f"Before Food : {const_first} — Constitutional support to strengthen core structural metabolism.",
            },
            "after_food": {
                "medicine": t_tissue,
                "label": f"After Food  : {t_tissue} — {tissue_desc}",
            },
            "night_dose": {
                "medicine": night_med,
                "label": f"Night Dose  : {night_med} — {night_desc}",
            },
        }

        return {
            "formula": " + ".join(tablet_remedies) + f" — {tablet_dilution}",
            "medicines": tablet_remedies,
            "primary_system": sys_key,
            "three_tier_classification": three_tier,
            "tier_labels": [
                three_tier["before_food"]["label"],
                three_tier["after_food"]["label"],
                three_tier["night_dose"]["label"],
            ],
            "potency_rationale": (
                "NEGATIVE hypoactive (Low BP) — tablet at D5 stimulates weak organs."
                if is_hypoactive
                else "POSITIVE hyperactive — tablet at D5/D6 sustains regulation between liquid doses."
            ),
        }
