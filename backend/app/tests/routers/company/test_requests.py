import uuid

import pytest
from app.models.enums import UserRole
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# SUBMIT
# ---------------------------------------------------------------------------


async def test_submit_request_happy_path(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    """Verified user without company + active NIP → 201, PENDING."""
    await company_factory(nip="1234567890")
    user = await user_factory(email="applicant@test.com", is_verified=True)

    response = await async_client.post(
        "/companies/requests",
        json={"requested_nip": "1234567890"},
        headers=auth_headers(user),
    )

    assert response.status_code == 201
    data = response.json()
    assert data["requested_nip"] == "1234567890"
    assert data["status"] == "PENDING"
    assert data["reviewed_at"] is None


async def test_submit_request_unknown_nip(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
):
    """Unknown NIP → 404."""
    user = await user_factory(email="x@test.com", is_verified=True)

    response = await async_client.post(
        "/companies/requests",
        json={"requested_nip": "9999999999"},
        headers=auth_headers(user),
    )

    assert response.status_code == 404


async def test_submit_request_inactive_company(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    """NIP of inactive company → 404."""
    await company_factory(nip="1111111111", is_active=False)
    user = await user_factory(email="y@test.com", is_verified=True)

    response = await async_client.post(
        "/companies/requests",
        json={"requested_nip": "1111111111"},
        headers=auth_headers(user),
    )

    assert response.status_code == 404


async def test_submit_request_already_in_company(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    """User already with company_id → 400."""
    company = await company_factory(nip="2222222222")
    user = await user_factory(
        email="z@test.com", is_verified=True, company_id=company.id
    )

    response = await async_client.post(
        "/companies/requests",
        json={"requested_nip": "2222222222"},
        headers=auth_headers(user),
    )

    assert response.status_code == 400


async def test_submit_request_duplicate_pending(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    """Second submit while a PENDING request exists → 409."""
    await company_factory(nip="3333333333")
    user = await user_factory(email="dup@test.com", is_verified=True)

    headers = auth_headers(user)
    await async_client.post(
        "/companies/requests",
        json={"requested_nip": "3333333333"},
        headers=headers,
    )

    response = await async_client.post(
        "/companies/requests",
        json={"requested_nip": "3333333333"},
        headers=headers,
    )

    assert response.status_code == 409


async def test_submit_request_no_token(async_client: AsyncClient):
    """No token → 401."""
    response = await async_client.post(
        "/companies/requests",
        json={"requested_nip": "1234567890"},
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# GET /requests/me
# ---------------------------------------------------------------------------


async def test_get_my_requests_returns_own_only(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
):
    """GET /requests/me returns only the current user's requests."""
    await company_factory(nip="4444444444")
    user_a = await user_factory(email="a@test.com", is_verified=True)
    user_b = await user_factory(email="b@test.com", is_verified=True)

    await async_client.post(
        "/companies/requests",
        json={"requested_nip": "4444444444"},
        headers=auth_headers(user_a),
    )
    await async_client.post(
        "/companies/requests",
        json={"requested_nip": "4444444444"},
        headers=auth_headers(user_b),
    )

    response = await async_client.get(
        "/companies/requests/me",
        headers=auth_headers(user_a),
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


# ---------------------------------------------------------------------------
# GET /requests/pending
# ---------------------------------------------------------------------------


async def test_pending_requests_admin_sees_own_nip_only(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    """company_admin sees only requests matching their company's NIP."""
    company_a = await company_factory(nip="5555555555")
    await company_factory(nip="6666666666", name="Other Corp")

    admin = await user_factory(
        email="admin@test.com",
        is_verified=True,
        company_id=company_a.id,
        role=UserRole.COMPANY_ADMIN,
    )
    applicant_a = await user_factory(email="ap-a@test.com", is_verified=True)
    applicant_b = await user_factory(email="ap-b@test.com", is_verified=True)

    await async_client.post(
        "/companies/requests",
        json={"requested_nip": "5555555555"},
        headers=auth_headers(applicant_a),
    )
    await async_client.post(
        "/companies/requests",
        json={"requested_nip": "6666666666"},
        headers=auth_headers(applicant_b),
    )

    response = await async_client.get(
        "/companies/requests/pending",
        headers=auth_headers(admin),
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["requested_nip"] == "5555555555"


async def test_pending_requests_customer_forbidden(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
):
    """CUSTOMER role → 403."""
    user = await user_factory(email="customer@test.com", is_verified=True)

    response = await async_client.get(
        "/companies/requests/pending",
        headers=auth_headers(user),
    )

    assert response.status_code == 403


# ---------------------------------------------------------------------------
# APPROVE / REJECT
# ---------------------------------------------------------------------------


async def _setup_admin_and_request(
    async_client, db_session, user_factory, company_factory, auth_headers, nip: str
):
    """Helper: creates a company, an admin, an applicant, and a pending request."""
    company = await company_factory(nip=nip)
    admin = await user_factory(
        email=f"admin-{nip}@test.com",
        is_verified=True,
        company_id=company.id,
        role=UserRole.COMPANY_ADMIN,
    )
    applicant = await user_factory(
        email=f"applicant-{nip}@test.com", is_verified=True
    )

    create_resp = await async_client.post(
        "/companies/requests",
        json={"requested_nip": nip},
        headers=auth_headers(applicant),
    )
    assert create_resp.status_code == 201

    return company, admin, applicant, create_resp.json()["id"]


async def test_approve_sets_company_id_and_status(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    """Approve: status=APPROVED, reviewed_at set, applicant gets company_id."""
    company, admin, applicant, request_id = await _setup_admin_and_request(
        async_client, db_session, user_factory, company_factory, auth_headers,
        nip="7777777777",
    )

    response = await async_client.post(
        f"/companies/requests/{request_id}/approve",
        headers=auth_headers(admin),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "APPROVED"
    assert data["reviewed_at"] is not None

    await db_session.refresh(applicant)
    assert applicant.company_id == company.id


async def test_reject_leaves_company_id_none(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    """Reject: status=REJECTED, applicant.company_id stays None."""
    _company, admin, applicant, request_id = await _setup_admin_and_request(
        async_client, db_session, user_factory, company_factory, auth_headers,
        nip="8888888888",
    )

    response = await async_client.post(
        f"/companies/requests/{request_id}/reject",
        headers=auth_headers(admin),
    )

    assert response.status_code == 200
    assert response.json()["status"] == "REJECTED"

    await db_session.refresh(applicant)
    assert applicant.company_id is None


async def test_review_wrong_nip_returns_403(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    """Admin of company A cannot approve a request for company B's NIP."""
    company_a = await company_factory(nip="1122334455")
    await company_factory(nip="5544332211", name="Other Corp 2")

    admin = await user_factory(
        email="admin-wrong@test.com",
        is_verified=True,
        company_id=company_a.id,
        role=UserRole.COMPANY_ADMIN,
    )
    applicant = await user_factory(email="applicant-wrong@test.com", is_verified=True)

    create_resp = await async_client.post(
        "/companies/requests",
        json={"requested_nip": "5544332211"},
        headers=auth_headers(applicant),
    )
    request_id = create_resp.json()["id"]

    response = await async_client.post(
        f"/companies/requests/{request_id}/approve",
        headers=auth_headers(admin),
    )

    assert response.status_code == 403


async def test_review_already_reviewed_returns_409(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user_factory,
    company_factory,
    auth_headers,
):
    """Re-reviewing an already-APPROVED request → 409."""
    _company, admin, _applicant, request_id = await _setup_admin_and_request(
        async_client, db_session, user_factory, company_factory, auth_headers,
        nip="9988776655",
    )

    await async_client.post(
        f"/companies/requests/{request_id}/approve",
        headers=auth_headers(admin),
    )

    response = await async_client.post(
        f"/companies/requests/{request_id}/approve",
        headers=auth_headers(admin),
    )

    assert response.status_code == 409


async def test_review_customer_returns_403(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
):
    """CUSTOMER trying to approve/reject → 403 (no role check needed, just 403)."""
    customer = await user_factory(email="customer2@test.com", is_verified=True)

    response = await async_client.post(
        f"/companies/requests/{uuid.uuid4()}/approve",
        headers=auth_headers(customer),
    )

    assert response.status_code == 403
