import uuid

from app.models.enums import UserRole
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


async def _make_admin(user_factory, company_factory, nip: str):
    """Creates a company + a COMPANY_ADMIN user assigned to it."""
    company = await company_factory(nip=nip)
    admin = await user_factory(
        email=f"admin-{nip}@test.com",
        is_verified=True,
        company_id=company.id,
        role=UserRole.COMPANY_ADMIN,
    )
    return company, admin


# ---------------------------------------------------------------------------
# GET /companies/members
# ---------------------------------------------------------------------------


async def test_list_members_returns_own_company_only(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    """Admin sees only members of their own company."""
    company_a, admin = await _make_admin(user_factory, company_factory, "1010101010")
    company_b = await company_factory(nip="2020202020", name="Other Corp")

    member = await user_factory(
        email="member@test.com", is_verified=True, company_id=company_a.id
    )
    await user_factory(
        email="other@test.com", is_verified=True, company_id=company_b.id
    )

    response = await async_client.get(
        "/companies/members", headers=auth_headers(admin)
    )

    assert response.status_code == 200
    body = response.json()
    ids = [u["id"] for u in body]
    assert str(admin.id) in ids
    assert str(member.id) in ids
    assert len(ids) == 2
    assert "company_joined_at" in body[0]


async def test_list_members_customer_forbidden(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
):
    """CUSTOMER → 403."""
    user = await user_factory(email="cust@test.com", is_verified=True)

    response = await async_client.get(
        "/companies/members", headers=auth_headers(user)
    )

    assert response.status_code == 403


# ---------------------------------------------------------------------------
# DELETE /companies/members/{user_id}
# ---------------------------------------------------------------------------


async def test_remove_member_clears_company_id(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    """Removing a member sets their company_id to None."""
    company, admin = await _make_admin(user_factory, company_factory, "3030303030")
    member = await user_factory(
        email="to-remove@test.com", is_verified=True, company_id=company.id
    )

    response = await async_client.delete(
        f"/companies/members/{member.id}", headers=auth_headers(admin)
    )

    assert response.status_code == 200
    assert "removed" in response.json()["message"].lower()

    await db_session.refresh(member)
    assert member.company_id is None


async def test_remove_self_returns_400(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    """Admin cannot remove themselves → 400."""
    _company, admin = await _make_admin(user_factory, company_factory, "4040404040")

    response = await async_client.delete(
        f"/companies/members/{admin.id}", headers=auth_headers(admin)
    )

    assert response.status_code == 400


async def test_remove_member_from_other_company_returns_403(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    """Admin of company A cannot remove a member of company B → 403."""
    _company_a, admin = await _make_admin(user_factory, company_factory, "5050505050")
    company_b = await company_factory(nip="6060606060", name="Other Corp 3")
    other_member = await user_factory(
        email="b-member@test.com", is_verified=True, company_id=company_b.id
    )

    response = await async_client.delete(
        f"/companies/members/{other_member.id}", headers=auth_headers(admin)
    )

    assert response.status_code == 403


async def test_remove_member_nonexistent_user_returns_404(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    """Target user does not exist → 404."""
    _company, admin = await _make_admin(user_factory, company_factory, "7070707070")

    response = await async_client.delete(
        f"/companies/members/{uuid.uuid4()}", headers=auth_headers(admin)
    )

    assert response.status_code == 404


async def test_remove_member_customer_forbidden(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
):
    """CUSTOMER trying to remove → 403."""
    customer = await user_factory(email="c2@test.com", is_verified=True)

    response = await async_client.delete(
        f"/companies/members/{uuid.uuid4()}", headers=auth_headers(customer)
    )

    assert response.status_code == 403
