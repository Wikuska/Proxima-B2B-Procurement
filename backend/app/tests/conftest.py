import pytest
import pytest_asyncio
from app.core.security import create_access_token
from app.core.settings import settings
from app.database import get_db
from app.main import app
from app.models import Base, Company, User
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


@pytest.fixture
def auth_headers():
    """Factory fixture: given a user, returns Authorization headers with a valid JWT."""

    def _make_headers(user):
        token = create_access_token(subject=str(user.id))
        return {"Authorization": f"Bearer {token}"}

    return _make_headers


@pytest_asyncio.fixture
async def company_factory(db_session: AsyncSession):
    """Factory fixture to dynamically create companies for tests."""

    async def _create_company(**kwargs):
        company_data = {
            "name": "Test Company",
            "nip": "1234567890",
            "is_active": True,
        }
        company_data.update(kwargs)

        company = Company(**company_data)
        db_session.add(company)
        await db_session.commit()
        return company

    return _create_company
