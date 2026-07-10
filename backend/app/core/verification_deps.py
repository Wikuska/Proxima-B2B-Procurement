from collections.abc import AsyncGenerator

from app.services.verification_code_store import VerificationCodeStore
from fastapi import Depends
from redis.asyncio import Redis

from app.core.redis import get_redis


async def get_verification_code_store(
    redis: Redis = Depends(get_redis),
) -> AsyncGenerator[VerificationCodeStore, None]:
    yield VerificationCodeStore(redis)
