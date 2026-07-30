from __future__ import annotations

from .disease_package import DiseasePackage, _tokenize
from .normalize import NormalizedEvidence


NOISE_TOKENS = {
    "gene",
    "virus",
    "equine",
    "canine",
    "bovine",
    "omim",
    "chromosome",
}


def retrieve_diseases(
    package: DiseasePackage,
    evidence: NormalizedEvidence,
    *,
    top_k: int = 5,
) -> list[dict]:
    """
    Multi-candidate retrieval. Never force a single top-1 diagnosis.
    Returns empty list on no match (UNKNOWN/no-match is valid).
    """
    package.ensure_index()
    assert package._token_index is not None
    query_tokens = [t for t in evidence.tokens if t not in NOISE_TOKENS and t not in evidence.negated_symptoms]
    if evidence.chief_complaint:
        query_tokens.extend(_tokenize(evidence.chief_complaint))
    query_tokens = list(dict.fromkeys(query_tokens))
    if not query_tokens:
        return []

    scores: dict[int, float] = {}
    for tok in query_tokens:
        for idx in package._token_index.get(tok, []):
            scores[idx] = scores.get(idx, 0.0) + 1.0

    # Soft penalty for noise-looking English names
    ranked: list[tuple[float, int]] = []
    for idx, sc in scores.items():
        row = package.records[idx]
        name = str(row.get("name_english") or "").lower()
        if any(n in name for n in NOISE_TOKENS):
            sc *= 0.15
        # Prefer chief-complaint token hits
        if evidence.chief_complaint and evidence.chief_complaint in name:
            sc += 2.0
        ranked.append((sc, idx))

    ranked.sort(key=lambda x: (-x[0], x[1]))
    if not ranked:
        return []

    # Require minimum support; do not invent matches
    max_score = ranked[0][0]
    if max_score < 1.0:
        return []

    out: list[dict] = []
    for sc, idx in ranked[: max(top_k, 5)]:
        if sc < 1.0:
            continue
        row = package.records[idx]
        out.append(
            {
                "disease_id": row.get("id"),
                "name_english": row.get("name_english"),
                "name_hindi": row.get("name_hindi"),
                "system_key": row.get("system_key"),
                "score": round(sc, 4),
                "confidence": round(min(1.0, sc / (max_score + 1e-9)), 4),
                "forced_top1": False,
            }
        )
    return out
