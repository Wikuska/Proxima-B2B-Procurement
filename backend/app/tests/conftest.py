import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool
from app.core.settings import settings
from app.database import get_db
from app.models import Base
from app.main import app

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
        expire_on_commit=False
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
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac