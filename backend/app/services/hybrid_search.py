"""Hybrid search helpers (FTS + vector ranking fusion)."""

from __future__ import annotations

import uuid

# Standard RRF constant from the original paper / common IR practice.
RRF_K = 60


def reciprocal_rank_fusion(
    ranked_lists: list[list[uuid.UUID]],
    k: int = RRF_K,
) -> list[uuid.UUID]:
    """Merge ranked ID lists by reciprocal rank; higher score = better."""
    scores: dict[uuid.UUID, float] = {}
    for ranked in ranked_lists:
        for rank, product_id in enumerate(ranked, start=1):
            scores[product_id] = scores.get(product_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores.keys(), key=lambda pid: (-scores[pid], str(pid)))
