import uuid

from app.models.enums import UserRole
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


async def _make_admin(user_factory, company_factory, nip: str, **company_kwargs):
    company = await company_factory(nip=nip, **company_kwargs)
    admin = await user_factory(
        email=f"admin-{nip}@test.com",
        is_verified=True,
        company_id=company.id,
        role=UserRole.COMPANY_ADMIN,
    )
    return company, admin


# ---------------------------------------------------------------------------
# GET /companies/settings
# ---------------------------------------------------------------------------


async def test_get_settings_returns_company_fields(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    company, admin = await _make_admin(
        user_factory,
        company_factory,
        "8111111111",
        name="Settings Corp",
        phone="+48 111 222 333",
        discount_percentage="7.50",
    )

    response = await async_client.get(
        "/companies/settings", headers=auth_headers(admin)
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(company.id)
    assert data["name"] == "Settings Corp"
    assert data["nip"] == "8111111111"
    assert data["phone"] == "+48 111 222 333"
    assert data["discount_percentage"] == "7.50"


async def test_get_settings_customer_forbidden(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
):
    user = await user_factory(email="cust-settings@test.com", is_verified=True)
    response = await async_client.get(
        "/companies/settings", headers=auth_headers(user)
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# PATCH /companies/settings
# ---------------------------------------------------------------------------


async def test_patch_settings_updates_name_and_phone(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    company, admin = await _make_admin(
        user_factory, company_factory, "8222222222", name="Old Name", phone="111"
    )

    response = await async_client.patch(
        "/companies/settings",
        headers=auth_headers(admin),
        json={"name": "New Name", "phone": "999"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["phone"] == "999"
    assert data["nip"] == "8222222222"

    await db_session.refresh(company)
    assert company.name == "New Name"
    assert company.phone == "999"


async def test_patch_settings_clears_phone(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    company, admin = await _make_admin(
        user_factory, company_factory, "8333333333", phone="123"
    )

    response = await async_client.patch(
        "/companies/settings",
        headers=auth_headers(admin),
        json={"phone": None},
    )

    assert response.status_code == 200
    assert response.json()["phone"] is None
    await db_session.refresh(company)
    assert company.phone is None


async def test_patch_settings_does_not_change_nip(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    company, admin = await _make_admin(
        user_factory, company_factory, "8444444444", name="Keep NIP"
    )

    response = await async_client.patch(
        "/companies/settings",
        headers=auth_headers(admin),
        json={"name": "Renamed", "nip": "9999999999"},
    )

    assert response.status_code == 200
    assert response.json()["nip"] == "8444444444"
    await db_session.refresh(company)
    assert company.nip == "8444444444"
    assert company.name == "Renamed"


# ---------------------------------------------------------------------------
# POST /companies/transfer-ownership
# ---------------------------------------------------------------------------


async def test_transfer_ownership_swaps_roles(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    company, admin = await _make_admin(user_factory, company_factory, "8555555555")
    member = await user_factory(
        email="member-transfer@test.com",
        is_verified=True,
        company_id=company.id,
        role=UserRole.CUSTOMER,
    )

    response = await async_client.post(
        "/companies/transfer-ownership",
        headers=auth_headers(admin),
        json={"user_id": str(member.id)},
    )

    assert response.status_code == 200
    assert "transferred" in response.json()["message"].lower()

    await db_session.refresh(admin)
    await db_session.refresh(member)
    assert admin.role == UserRole.CUSTOMER
    assert admin.company_id == company.id
    assert member.role == UserRole.COMPANY_ADMIN
    assert member.company_id == company.id


async def test_transfer_ownership_to_self_returns_400(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    _company, admin = await _make_admin(user_factory, company_factory, "8666666666")

    response = await async_client.post(
        "/companies/transfer-ownership",
        headers=auth_headers(admin),
        json={"user_id": str(admin.id)},
    )

    assert response.status_code == 400


async def test_transfer_ownership_other_company_returns_403(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    _company_a, admin = await _make_admin(user_factory, company_factory, "8777777777")
    company_b = await company_factory(nip="8888888888", name="Other")
    other = await user_factory(
        email="other-co@test.com",
        is_verified=True,
        company_id=company_b.id,
        role=UserRole.CUSTOMER,
    )

    response = await async_client.post(
        "/companies/transfer-ownership",
        headers=auth_headers(admin),
        json={"user_id": str(other.id)},
    )

    assert response.status_code == 403


async def test_transfer_ownership_to_admin_returns_400(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    company, admin = await _make_admin(user_factory, company_factory, "8999999999")
    other_admin = await user_factory(
        email="second-admin@test.com",
        is_verified=True,
        company_id=company.id,
        role=UserRole.COMPANY_ADMIN,
    )

    response = await async_client.post(
        "/companies/transfer-ownership",
        headers=auth_headers(admin),
        json={"user_id": str(other_admin.id)},
    )

    assert response.status_code == 400


async def test_transfer_ownership_nonexistent_user_returns_404(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    _company, admin = await _make_admin(user_factory, company_factory, "8000000001")

    response = await async_client.post(
        "/companies/transfer-ownership",
        headers=auth_headers(admin),
        json={"user_id": str(uuid.uuid4())},
    )

    assert response.status_code == 404
