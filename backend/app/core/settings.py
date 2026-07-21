from decimal import Decimal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: SecretStr
    SECRET_KEY: SecretStr
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    TEST_DATABASE_URL: SecretStr
    FRONTEND_URL: str = "http://localhost:5173"
    MAX_TOTAL_DISCOUNT_PERCENT: Decimal = Decimal("50")

    PORTFOLIO_MODE: bool = True
    REDIS_URL: str = "redis://localhost:6379/0"
    EMAIL_VERIFICATION_CODE_EXPIRE_MINUTES: int = 15
    EMAIL_VERIFICATION_MAX_ATTEMPTS: int = 5
    EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: int = 60
    EMAIL_VERIFICATION_LOCK_SECONDS: int = 15
    PORTFOLIO_VERIFICATION_CODE: str = "000000"

    # Semantic / hybrid search. Default off for lightweight local/tests;
    # Docker Compose enables it and bakes EMBEDDING_MODEL_NAME into the image.
    SEMANTIC_SEARCH_ENABLED: bool = False
    EMBEDDING_MODEL_NAME: str = (
        "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )
    SEMANTIC_SEARCH_CANDIDATE_LIMIT: int = 50
    # Cosine distance cutoff for vector hits (normalized embeddings: 0 = identical).
    # Lower = stricter. FTS matches are never dropped by this threshold.
    SEMANTIC_SEARCH_MAX_DISTANCE: float = 0.70

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()  # type: ignore[call-arg]
