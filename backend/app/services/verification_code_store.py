import time
from dataclasses import dataclass

from app.core.settings import settings
from redis.asyncio import Redis

VERIFICATION_KEY_PREFIX = "email_verification:"
VERIFY_LOCK_KEY_PREFIX = "email_verify_lock:"


@dataclass(frozen=True)
class VerificationChallenge:
    code_hash: str
    attempts: int
    sent_at: int


def normalize_verification_email(email: str) -> str:
    return email.strip().lower()


class VerificationCodeStore:
    def __init__(self, redis: Redis) -> None:
        self._redis = redis

    def _verification_key(self, email: str) -> str:
        return f"{VERIFICATION_KEY_PREFIX}{normalize_verification_email(email)}"

    def _lock_key(self, email: str) -> str:
        return f"{VERIFY_LOCK_KEY_PREFIX}{normalize_verification_email(email)}"

    @property
    def _ttl_seconds(self) -> int:
        return settings.EMAIL_VERIFICATION_CODE_EXPIRE_MINUTES * 60

    async def save_code(self, email: str, code_hash: str) -> None:
        key = self._verification_key(email)
        now = int(time.time())
        await self._redis.hset(
            key,
            mapping={
                "code_hash": code_hash,
                "attempts": 0,
                "sent_at": now,
            },
        )
        await self._redis.expire(key, self._ttl_seconds)

    async def get_challenge(self, email: str) -> VerificationChallenge | None:
        data = await self._redis.hgetall(self._verification_key(email))
        if not data:
            return None
        return VerificationChallenge(
            code_hash=data["code_hash"],
            attempts=int(data["attempts"]),
            sent_at=int(data["sent_at"]),
        )

    async def increment_attempts(self, email: str) -> int:
        return int(
            await self._redis.hincrby(self._verification_key(email), "attempts", 1)
        )

    async def delete_code(self, email: str) -> None:
        await self._redis.delete(self._verification_key(email))

    async def acquire_verify_lock(self, email: str) -> bool:
        return bool(
            await self._redis.set(
                self._lock_key(email),
                "1",
                nx=True,
                ex=settings.EMAIL_VERIFICATION_LOCK_SECONDS,
            )
        )

    async def release_verify_lock(self, email: str) -> None:
        await self._redis.delete(self._lock_key(email))
