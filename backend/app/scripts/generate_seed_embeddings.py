"""
Export demo catalog embeddings to data/demo_product_embeddings.json.

Run from backend/ (venv with requirements-ai.txt, SEMANTIC_SEARCH_ENABLED=true):

  python -m app.scripts.export_demo_embeddings

Uses the same seed catalog definitions as seed.py (no DB required).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from app.ai.embedding import embedding_service
from seed import CATEGORIES, PRODUCTS

OUTPUT_PATH = Path(__file__).resolve().parents[2] / "data" / "demo_product_embeddings.json"


def _embedding_text(
    name: str, sku: str, description: str, category_name: str
) -> str:
    parts = [name, f"SKU {sku}", category_name, description or ""]
    return " | ".join(part for part in parts if part)


def main() -> int:
    if not embedding_service.is_available():
        print(
            "Embedding service unavailable.\n"
            "1) pip install -r requirements-ai.txt\n"
            "2) Set SEMANTIC_SEARCH_ENABLED=true in backend/.env\n"
            "3) Re-run this command.",
            file=sys.stderr,
        )
        return 1

    category_names = {c["slug"]: c["name"] for c in CATEGORIES}
    items: list[tuple[str, str]] = []
    for category_slug, products in PRODUCTS.items():
        cat_name = category_names[category_slug]
        for name, _slug, sku, description, *_rest in products:
            items.append((sku, _embedding_text(name, sku, description, cat_name)))

    print(f"Embedding {len(items)} seed product(s)...")
    skus = [sku for sku, _ in items]
    texts = [text for _, text in items]
    vectors = embedding_service.embed_texts(texts)

    payload = {sku: vector for sku, vector in zip(skus, vectors, strict=True)}
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload), encoding="utf-8")
    print(f"Wrote {len(payload)} embeddings -> {OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
