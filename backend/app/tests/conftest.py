import pytest_asyncio
from app.core.settings import settings
from app.database import get_db
from app.main import app
from app.models import Base, User
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

# Engine with NullPool to avoid connection pool issues in tests
engine = create_async_engine(settings.TEST_DATABASE_URL, poolclass=NullPool)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session():
    # Create connection
    connection = await engine.connect()
    # Start the main test transaction
    transaction = await connection.begin()

    # KEY: join_transaction_mode="create_savepoint"
    # This allows the application to perform operations inside the transaction
    # without conflicting with the main test transaction.
    session = AsyncSession(
        bind=connection,
        join_transaction_mode="create_savepoint",
        expire_on_commit=False,
    )

    yield session

    # Clean up
    await session.close()
    await transaction.rollback()
    await connection.close()


@pytest_asyncio.fixture(scope="function")
async def async_client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def user_factory(db_session: AsyncSession):
    """Factory fixture to dynamically create users for tests."""

    async def _create_user(**kwargs):
        # Default user data, can be overridden by test parameters
        user_data = {
            "email": "default@example.com",
            "password_hash": "hash",
            "first_name": "Test",
            "last_name": "User",
            "is_verified": False,
            "is_active": True,
            "company_id": None,
        }
        # Override defaults with any provided kwargs
        user_data.update(kwargs)

        user = User(**user_data)
        db_session.add(user)
        await db_session.commit()
        return user

    return _create_user
