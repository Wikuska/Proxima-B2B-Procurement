"""Local embedding model wrapper (optional semantic search).

Install extras: pip install -r requirements-ai.txt
Enable: SEMANTIC_SEARCH_ENABLED=true
"""

from __future__ import annotations

import logging

from app.core.settings import settings
from app.models.product import Product

logger = logging.getLogger(__name__)


def build_product_embedding_text(
    product: Product, category_name: str | None = None
) -> str:
    parts = [
        product.name,
        f"SKU {product.sku}",
        category_name or "",
        product.description or "",
    ]
    return " | ".join(part for part in parts if part)


class EmbeddingService:
    """Lazy-loads sentence-transformers; never raises into catalog request handlers."""

    def __init__(self) -> None:
        self._model = None
        self._load_attempted = False
        self._available = False

    def is_available(self) -> bool:
        if not settings.SEMANTIC_SEARCH_ENABLED:
            return False
        if not self._load_attempted:
            self._try_load()
        return self._available

    def _try_load(self) -> None:
        self._load_attempted = True
        try:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
            self._available = True
            logger.info(
                "Loaded embedding model %s", settings.EMBEDDING_MODEL_NAME
            )
        except Exception:
            logger.warning(
                "Embedding model unavailable; catalog search will use FTS only",
                exc_info=True,
            )
            self._model = None
            self._available = False

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not self.is_available() or self._model is None:
            raise RuntimeError(
                "Embedding service is not available. "
                "Install requirements-ai.txt and set SEMANTIC_SEARCH_ENABLED=true."
            )
        vectors = self._model.encode(texts, normalize_embeddings=True)
        return [vector.tolist() for vector in vectors]

    def embed_query(self, query: str) -> list[float]:
        return self.embed_texts([query])[0]


embedding_service = EmbeddingService()
