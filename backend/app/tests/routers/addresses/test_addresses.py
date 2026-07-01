"""Personal and company address endpoint tests."""
import pytest
import pytest_asyncio
from app.models.enums import AddressType, UserRole
from app.models.order import Address
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def solo_user(user_factory):
    return await user_factory(email="solo@example.com", is_verified=True)


@pytest_asyncio.fixture
async def other_user(user_factory):
    return await user_factory(email="other@example.com", is_verified=True)


@pytest_asyncio.fixture
async def company_setup(user_factory, company_factory):
    company = await company_factory(name="Corp Inc", nip="9876543210")
    member = await user_factory(
        email="member@corp.com",
        is_verified=True,
        role=UserRole.CUSTOMER,
        company_id=company.id,
    )
    admin = await user_factory(
        email="admin@corp.com",
        is_verified=True,
        role=UserRole.COMPANY_ADMIN,
        company_id=company.id,
    )
    return company, member, admin


_SHIPPING_PAYLOAD = {
    "address_type": "SHIPPING",
    "street": "Test St 1",
    "city": "Warsaw",
    "postal_code": "00-001",
    "country": "Poland",
}

_BILLING_PAYLOAD = {
    "address_type": "BILLING",
    "label": "HQ",
    "street": "HQ Ave 1",
    "city": "Warsaw",
    "postal_code": "00-100",
    "country": "Poland",
}


# ---------------------------------------------------------------------------
# Personal addresses
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_and_list_personal_address(
    async_client: AsyncClient,
    solo_user,
    auth_headers,
):
    resp = await async_client.post("/addresses", json=_SHIPPING_PAYLOAD, headers=auth_headers(solo_user))
    assert resp.status_code == 201
    assert resp.json()["street"] == "Test St 1"
    assert resp.json()["address_type"] == "SHIPPING"

    list_resp = await async_client.get("/addresses", headers=auth_headers(solo_user))
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1


@pytest.mark.asyncio
async def test_personal_address_only_own(
    async_client: AsyncClient,
    solo_user,
    other_user,
    auth_headers,
):
    await async_client.post("/addresses", json=_SHIPPING_PAYLOAD, headers=auth_headers(solo_user))

    resp = await async_client.get("/addresses", headers=auth_headers(other_user))
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_delete_personal_address(
    async_client: AsyncClient,
    solo_user,
    auth_headers,
):
    create_resp = await async_client.post("/addresses", json=_SHIPPING_PAYLOAD, headers=auth_headers(solo_user))
    address_id = create_resp.json()["id"]

    del_resp = await async_client.delete(f"/addresses/{address_id}", headers=auth_headers(solo_user))
    assert del_resp.status_code == 204

    list_resp = await async_client.get("/addresses", headers=auth_headers(solo_user))
    assert list_resp.json() == []


@pytest.mark.asyncio
async def test_delete_other_users_address_returns_404(
    async_client: AsyncClient,
    solo_user,
    other_user,
    auth_headers,
):
    create_resp = await async_client.post("/addresses", json=_SHIPPING_PAYLOAD, headers=auth_headers(solo_user))
    address_id = create_resp.json()["id"]

    resp = await async_client.delete(f"/addresses/{address_id}", headers=auth_headers(other_user))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_addresses_require_auth(async_client: AsyncClient):
    resp = await async_client.get("/addresses")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Company SHIPPING addresses
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_member_can_list_company_shipping_addresses(
    async_client: AsyncClient,
    company_setup,
    auth_headers,
):
    company, member, admin = company_setup

    await async_client.post(
        "/companies/addresses", json=_SHIPPING_PAYLOAD, headers=auth_headers(admin)
    )

    resp = await async_client.get("/companies/addresses/shipping", headers=auth_headers(member))
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["address_type"] == "SHIPPING"


@pytest.mark.asyncio
async def test_member_cannot_create_company_address(
    async_client: AsyncClient,
    company_setup,
    auth_headers,
):
    _, member, _ = company_setup
    resp = await async_client.post(
        "/companies/addresses", json=_SHIPPING_PAYLOAD, headers=auth_headers(member)
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_create_and_delete_company_address(
    async_client: AsyncClient,
    company_setup,
    auth_headers,
):
    _, _, admin = company_setup
    create_resp = await async_client.post(
        "/companies/addresses", json=_SHIPPING_PAYLOAD, headers=auth_headers(admin)
    )
    assert create_resp.status_code == 201
    address_id = create_resp.json()["id"]

    del_resp = await async_client.delete(
        f"/companies/addresses/{address_id}", headers=auth_headers(admin)
    )
    assert del_resp.status_code == 204


@pytest.mark.asyncio
async def test_billing_address_not_in_shipping_list(
    async_client: AsyncClient,
    company_setup,
    auth_headers,
):
    """BILLING address should not appear in the shipping address list."""
    _, member, admin = company_setup

    await async_client.post(
        "/companies/addresses", json=_BILLING_PAYLOAD, headers=auth_headers(admin)
    )
    await async_client.post(
        "/companies/addresses", json=_SHIPPING_PAYLOAD, headers=auth_headers(admin)
    )

    resp = await async_client.get("/companies/addresses/shipping", headers=auth_headers(member))
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["address_type"] == "SHIPPING"


# ---------------------------------------------------------------------------
# Company BILLING address
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_member_can_get_company_billing_address(
    async_client: AsyncClient,
    company_setup,
    auth_headers,
):
    _, member, admin = company_setup

    await async_client.post(
        "/companies/addresses", json=_BILLING_PAYLOAD, headers=auth_headers(admin)
    )

    resp = await async_client.get("/companies/addresses/billing", headers=auth_headers(member))
    assert resp.status_code == 200
    assert resp.json()["address_type"] == "BILLING"
    assert resp.json()["street"] == "HQ Ave 1"


@pytest.mark.asyncio
async def test_billing_address_returns_null_when_none(
    async_client: AsyncClient,
    company_setup,
    auth_headers,
):
    _, member, _ = company_setup
    resp = await async_client.get("/companies/addresses/billing", headers=auth_headers(member))
    assert resp.status_code == 200
    assert resp.json() is None


@pytest.mark.asyncio
async def test_one_billing_address_per_company(
    async_client: AsyncClient,
    company_setup,
    auth_headers,
):
    """Partial unique index ensures only one BILLING address per company."""
    _, _, admin = company_setup

    first = await async_client.post(
        "/companies/addresses", json=_BILLING_PAYLOAD, headers=auth_headers(admin)
    )
    assert first.status_code == 201

    second = await async_client.post(
        "/companies/addresses", json=_BILLING_PAYLOAD, headers=auth_headers(admin)
    )
    assert second.status_code in (400, 409, 500)


@pytest.mark.asyncio
async def test_no_access_between_companies(
    async_client: AsyncClient,
    company_setup,
    company_factory,
    user_factory,
    auth_headers,
):
    _, _, admin = company_setup

    other_company = await company_factory(name="Other Corp", nip="1111111111")
    other_admin = await user_factory(
        email="otheradmin@corp.com",
        is_verified=True,
        role=UserRole.COMPANY_ADMIN,
        company_id=other_company.id,
    )

    create_resp = await async_client.post(
        "/companies/addresses", json=_SHIPPING_PAYLOAD, headers=auth_headers(admin)
    )
    address_id = create_resp.json()["id"]

    del_resp = await async_client.delete(
        f"/companies/addresses/{address_id}", headers=auth_headers(other_admin)
    )
    assert del_resp.status_code == 404


@pytest.mark.asyncio
async def test_user_without_company_cannot_list_company_addresses(
    async_client: AsyncClient,
    solo_user,
    auth_headers,
):
    resp = await async_client.get("/companies/addresses/shipping", headers=auth_headers(solo_user))
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# PUT /companies/addresses/{id} — update company address
# ---------------------------------------------------------------------------

_UPDATE_PAYLOAD = {
    "address_type": "BILLING",
    "label": "New HQ",
    "street": "New St 99",
    "city": "Krakow",
    "postal_code": "30-001",
    "country": "Poland",
}


@pytest.mark.asyncio
async def test_admin_can_update_company_address(
    async_client: AsyncClient,
    company_setup,
    auth_headers,
):
    _, _, admin = company_setup

    create_resp = await async_client.post(
        "/companies/addresses", json=_BILLING_PAYLOAD, headers=auth_headers(admin)
    )
    assert create_resp.status_code == 201
    address_id = create_resp.json()["id"]

    put_resp = await async_client.put(
        f"/companies/addresses/{address_id}",
        json=_UPDATE_PAYLOAD,
        headers=auth_headers(admin),
    )
    assert put_resp.status_code == 200
    data = put_resp.json()
    assert data["street"] == "New St 99"
    assert data["city"] == "Krakow"
    assert data["label"] == "New HQ"


@pytest.mark.asyncio
async def test_member_cannot_update_company_address(
    async_client: AsyncClient,
    company_setup,
    auth_headers,
):
    _, member, admin = company_setup

    create_resp = await async_client.post(
        "/companies/addresses", json=_BILLING_PAYLOAD, headers=auth_headers(admin)
    )
    address_id = create_resp.json()["id"]

    resp = await async_client.put(
        f"/companies/addresses/{address_id}",
        json=_UPDATE_PAYLOAD,
        headers=auth_headers(member),
    )
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# DELETE billing address is blocked (400)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cannot_delete_billing_address(
    async_client: AsyncClient,
    company_setup,
    auth_headers,
):
    _, _, admin = company_setup

    create_resp = await async_client.post(
        "/companies/addresses", json=_BILLING_PAYLOAD, headers=auth_headers(admin)
    )
    assert create_resp.status_code == 201
    address_id = create_resp.json()["id"]

    del_resp = await async_client.delete(
        f"/companies/addresses/{address_id}", headers=auth_headers(admin)
    )
    assert del_resp.status_code == 400
