import pytest
from httpx import AsyncClient


@pytest.mark.parametrize(
    ("portfolio_mode", "expected_code"),
    [
        (True, "000000"),
        (False, None),
    ],
)
async def test_public_config_reflects_portfolio_mode(
    async_client: AsyncClient,
    monkeypatch,
    portfolio_mode: bool,
    expected_code: str | None,
):
    monkeypatch.setattr("app.routers.config.settings.PORTFOLIO_MODE", portfolio_mode)

    response = await async_client.get("/config/public")
    assert response.status_code == 200
    body = response.json()
    assert body["portfolio_mode"] is portfolio_mode
    assert body["portfolio_verification_code"] == expected_code
